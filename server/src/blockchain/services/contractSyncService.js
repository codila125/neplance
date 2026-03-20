const AppError = require("../../utils/appError");
const logger = require("../../utils/logger");
const Contract = require("../../models/Contract");
const { CONTRACT_STATUS } = require("../../constants/statuses");
const { resolveBlockchainBaseUrl } = require("../../config/blockchain");
const { mapContractToCreatePayload } = require("../models/contractPayloadModel");

const parseJson = async (response, fallbackMessage) => {
  try {
    return await response.json();
  } catch {
    throw new AppError(fallbackMessage, 502);
  }
};

const postJson = async (url, payload) => {
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
    throw new AppError("Foedus blockchain request failed", 502);
  }

  return response;
};

const extractFoedusContractId = (payload = {}) => {
  const contractId = payload?.contract_id;
  return typeof contractId === "string" && contractId.trim()
    ? contractId.trim()
    : null;
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
      createPayload
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
      }
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

module.exports = {
  syncActiveContractToBlockchain,
};
