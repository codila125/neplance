const AppError = require("../../utils/appError");
const logger = require("../../utils/logger");
const Contract = require("../../models/Contract");
const { CONTRACT_STATUS } = require("../../constants/statuses");
const { resolveBlockchainBaseUrl } = require("../../config/blockchain");
const { mapContractToCreatePayload } = require("../models/contractPayloadModel");
const {
  getMilestoneByIndex,
  includesAddress,
  isCompletedStatus,
} = require("../models/milestoneSyncModel");

const BLOCKCHAIN_SETTLE_DELAY_MS = Math.max(
  0,
  Number(process.env.BLOCKCHAIN_SETTLE_DELAY_MS) || 900
);

const parseJson = async (response, fallbackMessage) => {
  try {
    return await response.json();
  } catch {
    throw new AppError(fallbackMessage, 502);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForBlockchainSettle = async () => {
  if (BLOCKCHAIN_SETTLE_DELAY_MS > 0) {
    await sleep(BLOCKCHAIN_SETTLE_DELAY_MS);
  }
};

const getErrorReason = async (response) => {
  const errorText = await response.text().catch(() => "");
  if (typeof errorText === "string" && errorText.trim()) {
    return errorText.trim().slice(0, 240);
  }
  return `HTTP ${response.status}`;
};

const getJson = async (url, fallbackMessage) => {
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    const reason = await getErrorReason(response);
    throw new AppError(`Foedus blockchain request failed: ${reason}`, 502);
  }

  return parseJson(response, fallbackMessage);
};

const postJson = async (url, payload, options = {}) => {
  const { waitAfter = false } = options;
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    const reason = await getErrorReason(response);
    throw new AppError(`Foedus blockchain request failed: ${reason}`, 502);
  }

  if (waitAfter) {
    await waitForBlockchainSettle();
  }

  return response;
};

const extractFoedusContractId = (payload = {}) => {
  const contractId = payload?.contract_id;
  return typeof contractId === "string" && contractId.trim()
    ? contractId.trim()
    : null;
};

const extractFoedusMilestoneId = (contractPayload = {}, milestoneIndex = 0) => {
  const milestone = getMilestoneByIndex(contractPayload, milestoneIndex);
  const milestoneId = milestone?.id;

  return typeof milestoneId === "string" && milestoneId.trim()
    ? milestoneId.trim()
    : null;
};

const isMilestoneCompletedForParties = ({
  milestone,
  clientWalletId,
  freelancerWalletId,
}) => {
  if (!milestone || !isCompletedStatus(milestone.status)) {
    return false;
  }

  const approvedBy = Array.isArray(milestone.approved_by) ? milestone.approved_by : [];
  if (approvedBy.length === 0) {
    return true;
  }

  return (
    includesAddress(approvedBy, clientWalletId) &&
    includesAddress(approvedBy, freelancerWalletId)
  );
};

const waitForMilestoneCompletion = async ({
  contractUrl,
  milestoneIndex,
  clientWalletId,
  freelancerWalletId,
  attempts = 2,
  delayMs = BLOCKCHAIN_SETTLE_DELAY_MS,
}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const latestContract = await getJson(
      contractUrl,
      "Invalid contract response from Foedus blockchain"
    );
    const latestMilestone = getMilestoneByIndex(latestContract, milestoneIndex);

    if (
      isMilestoneCompletedForParties({
        milestone: latestMilestone,
        clientWalletId,
        freelancerWalletId,
      })
    ) {
      return true;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return false;
};

const waitForContractStatus = async ({
  contractUrl,
  targetStatus,
  attempts = 2,
  delayMs = BLOCKCHAIN_SETTLE_DELAY_MS,
}) => {
  const normalizedTarget = String(targetStatus || "").toUpperCase();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const latestContract = await getJson(
      contractUrl,
      "Invalid contract response from Foedus blockchain"
    );
    const latestStatus = String(latestContract?.status || "").toUpperCase();

    if (latestStatus === normalizedTarget) {
      return true;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return false;
};

const loadContractWithWallets = async (contractId) => {
  return Contract.findById(contractId)
    .populate("client", "walletId")
    .populate("freelancer", "walletId");
};

const markSyncFailed = async (contractId) => {
  await Contract.findByIdAndUpdate(contractId, {
    $set: {
      "blockchain.network": "foedus",
      "blockchain.syncStatus": "FAILED",
      updatedAt: new Date(),
    },
  });
};

const syncActiveContractToBlockchain = async (contractId) => {
  const contract = await Contract.findById(contractId)
    .populate("client", "walletId")
    .populate("freelancer", "walletId")
    .populate("job", "attachments deadline")
    .populate("proposal", "attachments");

  if (!contract) {
    throw new AppError("Contract not found for blockchain sync", 404);
  }

  if (contract.status !== CONTRACT_STATUS.ACTIVE) {
    return contract;
  }

  if (contract.blockchain?.syncStatus === "SYNCED" && contract.blockchain?.contractAddress) {
    return contract;
  }

  try {
    const creatorWalletId = contract.client?.walletId;
    const freelancerWalletId = contract.freelancer?.walletId;

    if (!creatorWalletId || !freelancerWalletId) {
      throw new AppError("Both client and freelancer must have wallet ids", 400);
    }

    const blockchainBaseUrl = resolveBlockchainBaseUrl();
    const createPayload = mapContractToCreatePayload({
      contract,
      freelancerWalletId,
    });

    const createResponse = await postJson(
      `${blockchainBaseUrl}/blockchain/createcontract/${creatorWalletId}`,
      createPayload,
      { waitAfter: true }
    );
    const createResult = await parseJson(
      createResponse,
      "Invalid create contract response from Foedus blockchain"
    );
    const contractAddress = extractFoedusContractId(createResult);

    if (!contractAddress) {
      throw new AppError("Foedus contract id missing in response", 502);
    }

    const approveResponse = await postJson(
      `${blockchainBaseUrl}/blockchain/approvecontract`,
      {
        contract_id: contractAddress,
        approver_address: freelancerWalletId,
      },
      { waitAfter: true }
    );
    await parseJson(
      approveResponse,
      "Invalid approve contract response from Foedus blockchain"
    );

    const updatedContract = await Contract.findByIdAndUpdate(
      contract._id,
      {
        $set: {
          "blockchain.network": "foedus",
          "blockchain.contractAddress": contractAddress,
          "blockchain.syncStatus": "SYNCED",
          "blockchain.syncedAt": new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    logger.info(`Contract synced to Foedus blockchain: ${contract._id}`);
    return updatedContract;
  } catch (error) {
    await markSyncFailed(contract._id);
    throw error;
  }
};

const syncApprovedMilestoneToBlockchain = async ({ contractId, milestoneIndex }) => {
  let contract = await loadContractWithWallets(contractId);

  if (!contract) {
    throw new AppError("Contract not found for milestone sync", 404);
  }

  if (!contract.blockchain?.contractAddress || contract.blockchain?.syncStatus !== "SYNCED") {
    await syncActiveContractToBlockchain(contractId);
    contract = await loadContractWithWallets(contractId);
  }

  const blockchainContractId = contract.blockchain?.contractAddress;
  if (!blockchainContractId || contract.blockchain?.syncStatus !== "SYNCED") {
    throw new AppError("Contract is not synced with blockchain", 400);
  }

  const clientWalletId = contract.client?.walletId;
  const freelancerWalletId = contract.freelancer?.walletId;

  if (!clientWalletId || !freelancerWalletId) {
    throw new AppError("Both client and freelancer must have wallet ids", 400);
  }

  const blockchainBaseUrl = resolveBlockchainBaseUrl();
  const contractUrl = `${blockchainBaseUrl}/blockchain/getcontract/${blockchainContractId}`;
  const blockchainContract = await getJson(
    contractUrl,
    "Invalid contract response from Foedus blockchain"
  );

  const milestoneId = extractFoedusMilestoneId(blockchainContract, milestoneIndex);
  if (!milestoneId) {
    throw new AppError("Foedus milestone id missing for contract milestone", 502);
  }

  const targetMilestone = getMilestoneByIndex(blockchainContract, milestoneIndex);
  if (!targetMilestone) {
    throw new AppError("Foedus milestone not found for provided index", 404);
  }

  if (
    isMilestoneCompletedForParties({
      milestone: targetMilestone,
      clientWalletId,
      freelancerWalletId,
    })
  ) {
    return contract;
  }

  const evidence =
    contract?.milestones?.[milestoneIndex]?.evidence ||
    `Milestone ${milestoneIndex + 1} approved in Neplance`;

  const ensureApproval = async (approverAddress) => {
    const latestContract = await getJson(
      contractUrl,
      "Invalid contract response from Foedus blockchain"
    );
    const latestMilestone = getMilestoneByIndex(latestContract, milestoneIndex);

    if (!latestMilestone) {
      throw new AppError("Foedus milestone not found for provided index", 404);
    }

    if (isMilestoneCompletedForParties({
      milestone: latestMilestone,
      clientWalletId,
      freelancerWalletId,
    })) {
      return;
    }

    if (includesAddress(latestMilestone.approved_by, approverAddress)) {
      return;
    }

    await postJson(`${blockchainBaseUrl}/blockchain/approvemilestone`, {
      contract_id: blockchainContractId,
      milestone_id: milestoneId,
      approver_address: approverAddress,
      evidence,
    }, { waitAfter: true });
  };

  await ensureApproval(clientWalletId);
  await ensureApproval(freelancerWalletId);

  const completedOnChain = await waitForMilestoneCompletion({
    contractUrl,
    milestoneIndex,
    clientWalletId,
    freelancerWalletId,
  });

  if (!completedOnChain) {
    throw new AppError("Milestone is not completed on Foedus blockchain", 502);
  }

  logger.info(
    `Milestone ${milestoneIndex} synced to Foedus blockchain for contract ${contract._id}`
  );

  return contract;
};

const syncAcceptedCancellationToBlockchain = async ({ contractId }) => {
  let contract = await loadContractWithWallets(contractId);

  if (!contract) {
    throw new AppError("Contract not found for cancellation sync", 404);
  }

  if (!contract.blockchain?.contractAddress || contract.blockchain?.syncStatus !== "SYNCED") {
    await syncActiveContractToBlockchain(contractId);
    contract = await loadContractWithWallets(contractId);
  }

  const blockchainContractId = contract.blockchain?.contractAddress;
  const cancellerAddress = contract.client?.walletId;

  if (!blockchainContractId || contract.blockchain?.syncStatus !== "SYNCED") {
    throw new AppError("Contract is not synced with blockchain", 400);
  }

  if (!cancellerAddress) {
    throw new AppError("Client wallet id is required for contract cancellation", 400);
  }

  const blockchainBaseUrl = resolveBlockchainBaseUrl();
  const contractUrl = `${blockchainBaseUrl}/blockchain/getcontract/${blockchainContractId}`;
  const blockchainContract = await getJson(
    contractUrl,
    "Invalid contract response from Foedus blockchain"
  );
  const currentStatus = String(blockchainContract?.status || "").toUpperCase();

  if (currentStatus === "CANCELLED") {
    return contract;
  }

  await postJson(
    `${blockchainBaseUrl}/blockchain/cancelcontract`,
    {
      contract_id: blockchainContractId,
      canceller_address: cancellerAddress,
    },
    { waitAfter: true }
  );

  const cancelledOnChain = await waitForContractStatus({
    contractUrl,
    targetStatus: "CANCELLED",
  });

  if (!cancelledOnChain) {
    throw new AppError("Contract is not cancelled on Foedus blockchain", 502);
  }

  logger.info(`Contract cancellation synced to Foedus blockchain: ${contract._id}`);

  return contract;
};

module.exports = {
  syncActiveContractToBlockchain,
  syncApprovedMilestoneToBlockchain,
  syncAcceptedCancellationToBlockchain,
};
