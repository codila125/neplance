const isCompletedStatus = (status) => String(status || "").toUpperCase() === "COMPLETED";

const includesAddress = (approvedBy = [], address = "") => {
  const normalizedAddress = String(address || "").trim().toLowerCase();
  if (!normalizedAddress) {
    return false;
  }

  return approvedBy.some(
    (value) => String(value || "").trim().toLowerCase() === normalizedAddress
  );
};

const getMilestoneByIndex = (contractPayload = {}, milestoneIndex = 0) => {
  const milestones = Array.isArray(contractPayload?.milestones)
    ? contractPayload.milestones
    : [];

  return milestones[milestoneIndex] || null;
};

module.exports = {
  getMilestoneByIndex,
  includesAddress,
  isCompletedStatus,
};
