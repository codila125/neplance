const AppError = require("../../utils/appError");
const { extractWalletId } = require("../models/walletModel");

const resolveBlockchainBaseUrl = () => {
  const baseUrl = process.env.BLOCKCHAIN_BASE_URL;
  if (!baseUrl) {
    throw new AppError("BLOCKCHAIN_BASE_URL is not configured", 500);
  }

  return baseUrl.replace(/\/+$/, "");
};

const resolveCreateWalletUrl = () => {
  return `${resolveBlockchainBaseUrl()}/blockchain/createwallet`;
};

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    throw new AppError("Invalid wallet response from Foedus blockchain", 502);
  }
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
};
