const AppError = require("../utils/appError");
const { PROPOSAL_STATUS } = require("../constants/statuses");
const {
  assertProposalCanReject,
  assertProposalCanUpdate,
  assertProposalCanWithdraw,
  assertProposalCanCreate,
} = require("./statusTransitions");

const createProposal = async (job) => {
  assertProposalCanCreate(job);
};

const rejectProposal = async (proposal, job, reason) => {
  assertProposalCanReject(job, proposal);

  proposal.status = PROPOSAL_STATUS.REJECTED;
  proposal.rejectionReason = typeof reason === "string" ? reason.trim() : undefined;
  proposal.rejectedAt = new Date();
  proposal.updatedAt = new Date();
  await proposal.save();
  return proposal;
};

const withdrawProposal = async (proposal) => {
  assertProposalCanWithdraw(proposal);
  proposal.status = PROPOSAL_STATUS.WITHDRAWN;
  proposal.withdrawnAt = new Date();
  await proposal.save();
  return proposal;
};

const updateProposal = async (proposal, payload = {}) => {
  assertProposalCanUpdate(proposal);

  proposal.amount = payload.amount;
  proposal.pricingType = payload.pricingType || "fixed_quote";
  proposal.coverLetter = payload.coverLetter;
  proposal.deliveryDays = payload.deliveryDays;
  proposal.revisionsIncluded = payload.revisionsIncluded;
  proposal.visitAvailableOn = payload.visitAvailableOn || undefined;
  proposal.inspectionNotes =
    typeof payload.inspectionNotes === "string"
      ? payload.inspectionNotes.trim()
      : "";
  proposal.attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : [];
  proposal.updatedAt = new Date();
  await proposal.save();
  return proposal;
};

module.exports = {
  createProposal,
  rejectProposal,
  updateProposal,
  withdrawProposal,
};
