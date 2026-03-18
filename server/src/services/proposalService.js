const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const AppError = require("../utils/appError");
const { JOB_STATUS, PROPOSAL_STATUS } = require("../constants/statuses");
const {
  assertProposalCanAccept,
  assertProposalCanReject,
  assertProposalCanWithdraw,
  assertProposalCanCreate,
} = require("./statusTransitions");

const createProposal = async (job) => {
  assertProposalCanCreate(job);
};

const acceptProposal = async (proposal, job) => {
  assertProposalCanAccept(job);
  throw new AppError(
    "Create a contract from the proposal to accept it and start the agreement",
    400
  );
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

module.exports = {
  createProposal,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
};
