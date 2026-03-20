const logger = require("../../utils/logger");
const {
  syncActiveContractToBlockchain,
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

module.exports = {
  syncCompletedMilestoneToBlockchain,
  syncSignedContractToBlockchain,
};
