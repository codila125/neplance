const AppError = require("../../utils/appError");
const { extractWalletId } = require("../models/walletModel");
const { resolveBlockchainBaseUrl } = require("../../config/blockchain");
const BlockchainBlock = require("../../models/BlockchainBlock");
const Contract = require("../../models/Contract");
const { getJson } = require("./httpClient");

const resolveCreateWalletUrl = () => {
  return `${resolveBlockchainBaseUrl()}/blockchain/createwallet`;
};

const resolvePrintChainUrl = () => {
  return `${resolveBlockchainBaseUrl()}/blockchain/printchain`;
};

const resolveGetContractUrl = (contractId) => {
  return `${resolveBlockchainBaseUrl()}/blockchain/getcontract/${encodeURIComponent(contractId)}`;
};

const fetchFoedusChain = async () => {
  const payload = await getJson(
    resolvePrintChainUrl(),
    "Invalid chain response from Foedus blockchain"
  );
  if (!Array.isArray(payload)) {
    throw new AppError("Invalid chain response from Foedus blockchain", 502);
  }

  return payload;
};

const normalizeBlock = (block = {}, index = 0) => {
  const hash = typeof block.hash === "string" ? block.hash.trim() : "";

  if (!hash) {
    return null;
  }

  return {
    hash,
    prevHash: typeof block.prev_hash === "string" ? block.prev_hash : "",
    blockIndex: index,
    contracts: Array.isArray(block.contract) ? block.contract : [],
    transactions: Array.isArray(block.transactions) ? block.transactions : [],
    sourceFetchedAt: new Date(),
    updatedAt: new Date(),
  };
};

const upsertBlocks = async (normalizedBlocks) => {
  const operations = normalizedBlocks.map((block) => ({
    updateOne: {
      filter: { hash: block.hash },
      update: { $set: block },
      upsert: true,
    },
  }));

  await BlockchainBlock.bulkWrite(operations, { ordered: false });
};

const sumMilestoneValues = (milestones) => {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return null;
  }

  return milestones.reduce((total, milestone) => {
    const value = Number(milestone?.value ?? 0);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
};

const getCalculatedContractTotal = (chainContract) => {
  const milestoneTotal = sumMilestoneValues(chainContract?.milestones);
  if (milestoneTotal !== null) {
    return milestoneTotal;
  }

  const fallback = Number(
    chainContract?.total_amount ?? chainContract?.totalAmount ?? 0
  );

  return Number.isFinite(fallback) ? fallback : 0;
};

const enrichBlocksWithContractMetadata = async (blocks) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }

  const contractIds = blocks.flatMap((block) =>
    Array.isArray(block.contracts)
      ? block.contracts
          .map((contract) =>
            typeof contract?.id === "string" ? contract.id.trim() : ""
          )
          .filter(Boolean)
      : []
  );

  if (contractIds.length === 0) {
    return blocks;
  }

  const uniqueContractIds = [...new Set(contractIds)];

  const [neplanceContracts, chainContractResults] = await Promise.all([
    Contract.find({
      "blockchain.contractAddress": { $in: uniqueContractIds },
    })
      .select("title milestones currency blockchain.contractAddress")
      .lean(),
    Promise.allSettled(
      uniqueContractIds.map(async (contractId) => ({
        contractId,
        data: await getJson(
          resolveGetContractUrl(contractId),
          "Invalid contract response from Foedus blockchain"
        ),
      }))
    ),
  ]);

  const chainContractMap = new Map();
  chainContractResults.forEach((result) => {
    if (result.status === "fulfilled" && result.value?.data) {
      chainContractMap.set(result.value.contractId, result.value.data);
    }
  });

  const contractMetaMap = new Map(
    neplanceContracts.map((contract) => {
      const milestoneTitles = Array.isArray(contract.milestones)
        ? contract.milestones
            .map((milestone) =>
              typeof milestone?.title === "string" ? milestone.title.trim() : ""
            )
            .filter(Boolean)
        : [];

      return [String(contract?.blockchain?.contractAddress || ""), {
        title: contract?.title || "",
        milestoneTitles,
      }];
    })
  );

  return blocks.map((block) => ({
    ...block,
    contracts: Array.isArray(block.contracts)
      ? block.contracts.map((contract) => {
          const contractId = typeof contract?.id === "string" ? contract.id.trim() : "";
          const metadata = contractMetaMap.get(contractId);
          const chainContract = chainContractMap.get(contractId);
          const calculatedTotal = chainContract
            ? getCalculatedContractTotal(chainContract)
            : null;

          return {
            ...contract,
            title: metadata?.title || contract?.title || "Untitled contract",
            milestoneTitles: metadata?.milestoneTitles || [],
            ...(calculatedTotal !== null ? { calculatedTotal } : {}),
            ...(metadata?.currency ? { currency: metadata.currency } : {}),
          };
        })
      : [],
  }));
};

const syncBlockchainBlocks = async () => {
  const chain = await fetchFoedusChain();
  const normalizedBlocks = chain
    .map((block, index) => normalizeBlock(block, index))
    .filter(Boolean);

  if (normalizedBlocks.length === 0) {
    return [];
  }

  await upsertBlocks(normalizedBlocks);

  const blocks = await BlockchainBlock.find({})
    .sort({ blockIndex: 1, sourceFetchedAt: 1 })
    .lean();

  return enrichBlocksWithContractMetadata(blocks);
};

const createFoedusWallet = async () => {
  const payload = await getJson(
    resolveCreateWalletUrl(),
    "Invalid wallet response from Foedus blockchain"
  );

  const walletId = extractWalletId(payload);
  if (!walletId) {
    throw new AppError("Wallet address missing in Foedus blockchain response", 502);
  }

  return walletId;
};

module.exports = {
  createFoedusWallet,
  syncBlockchainBlocks,
};
