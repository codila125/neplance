const AppError = require("../../utils/appError");
const { extractWalletId } = require("../models/walletModel");
const { resolveBlockchainBaseUrl } = require("../../config/blockchain");
const BlockchainBlock = require("../../models/BlockchainBlock");

const resolveCreateWalletUrl = () => {
  return `${resolveBlockchainBaseUrl()}/blockchain/createwallet`;
};

const resolvePrintChainUrl = () => {
  return `${resolveBlockchainBaseUrl()}/blockchain/printchain`;
};

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    throw new AppError("Invalid wallet response from Foedus blockchain", 502);
  }
};

const fetchFoedusChain = async () => {
  let response;

  try {
    response = await fetch(resolvePrintChainUrl(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    throw new AppError("Failed to fetch chain from Foedus blockchain", 502);
  }

  const payload = await parseJsonResponse(response);
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

const syncBlockchainBlocks = async () => {
  const chain = await fetchFoedusChain();
  const normalizedBlocks = chain
    .map((block, index) => normalizeBlock(block, index))
    .filter(Boolean);

  if (normalizedBlocks.length === 0) {
    return [];
  }

  const operations = normalizedBlocks.map((block) => ({
    updateOne: {
      filter: { hash: block.hash },
      update: { $set: block },
      upsert: true,
    },
  }));

  await BlockchainBlock.bulkWrite(operations, { ordered: false });

  return BlockchainBlock.find({})
    .sort({ blockIndex: -1, sourceFetchedAt: -1 })
    .lean();
};

const createFoedusWallet = async () => {
  let response;

  try {
    response = await fetch(resolveCreateWalletUrl(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    throw new AppError("Failed to create wallet from Foedus blockchain", 502);
  }

  const payload = await parseJsonResponse(response);

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
