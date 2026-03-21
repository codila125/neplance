const logger = require("../../utils/logger");
const {
  syncActiveContractToBlockchain,
  syncAcceptedCancellationToBlockchain,
  syncApprovedMilestoneToBlockchain,
} = require("../services/contractSyncService");

const syncSignedContractToBlockchain = async (contractId) => {
  try {
    return await syncActiveContractToBlockchain(contractId);
  } catch (error) {
    logger.error(`Contract blockchain sync failed for ${contractId}`, error?.message || error);
    throw error;
  }
};

const syncCompletedMilestoneToBlockchain = async ({ contractId, milestoneIndex }) => {
  try {
    return await syncApprovedMilestoneToBlockchain({ contractId, milestoneIndex });
  } catch (error) {
    logger.error(
      `Milestone blockchain sync failed for ${contractId}#${milestoneIndex}`,
      error?.message || error
    );
    throw error;
  }
};

const syncAcceptedCancellationToBlockchainStrict = async ({ contractId }) => {
  try {
    return await syncAcceptedCancellationToBlockchain({ contractId });
  } catch (error) {
    logger.error(
      `Cancellation blockchain sync failed for ${contractId}`,
      error?.message || error
    );
    throw error;
  }
};

module.exports = {
  syncAcceptedCancellationToBlockchainStrict,
  syncCompletedMilestoneToBlockchain,
  syncSignedContractToBlockchain,
};
