const logger = require("../../utils/logger");
const { syncActiveContractToBlockchain } = require("../services/contractSyncService");

const syncSignedContractToBlockchain = async (contractId) => {
  try {
    return await syncActiveContractToBlockchain(contractId);
  } catch (error) {
    logger.error(`Contract blockchain sync failed for ${contractId}`, error?.message || error);
    throw error;
  }
};

module.exports = {
  syncSignedContractToBlockchain,
};
