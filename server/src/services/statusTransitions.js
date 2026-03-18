const AppError = require("../utils/appError");
const {
  JOB_STATUS,
  PROPOSAL_STATUS,
  CANCELLATION_STATUS,
  MILESTONE_STATUS,
} = require("../constants/statuses");

const assertJobCanUpdate = (job) => {
  if (
    ![JOB_STATUS.DRAFT, JOB_STATUS.OPEN, JOB_STATUS.CONTRACT_PENDING].includes(
      job.status
    )
  ) {
    throw new AppError("Can only update draft or open jobs", 400);
  }
};

const normalizeJobCreateStatus = (status) => {
  return [JOB_STATUS.DRAFT, JOB_STATUS.OPEN].includes(status)
    ? status
    : JOB_STATUS.DRAFT;
};

const assertJobCanPublish = (job) => {
  if (job.status !== JOB_STATUS.DRAFT) {
    throw new AppError("Only draft jobs can be published", 400);
  }
};

const assertJobCanDelete = (job) => {
  if (
    ![JOB_STATUS.DRAFT, JOB_STATUS.OPEN, JOB_STATUS.CONTRACT_PENDING].includes(
      job.status
    )
  ) {
    throw new AppError("Can only delete draft or open jobs", 400);
  }
};

const assertJobCanMarkCompleted = (job) => {
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    throw new AppError(
      "Contract is not active, cannot mark as completed",
      400
    );
  }
};

const assertJobCanApproveCompletion = (job) => {
  if (job.status !== JOB_STATUS.COMPLETED) {
    throw new AppError("The contract is not marked completed yet", 400);
  }
};

const assertJobCanSubmitMilestone = (job, milestone) => {
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    throw new AppError(
      "Contract is not active, cannot submit milestones",
      400
    );
  }
  if (milestone.status !== MILESTONE_STATUS.ACTIVE) {
    throw new AppError("Milestone is not active, cannot submit", 400);
  }
};

const assertJobCanApproveMilestone = (milestone) => {
  if (milestone.status !== MILESTONE_STATUS.SUBMITTED) {
    throw new AppError("Milestone has not been submitted", 400);
  }
};

const assertJobCanRequestCancellation = (job) => {
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    throw new AppError("Only active jobs can be canceled", 400);
  }
  if (job.cancellation?.status === CANCELLATION_STATUS.PENDING) {
    throw new AppError("Cancellation already requested", 400);
  }
};

const assertJobCanRespondCancellation = (job, action, userId) => {
  if (job.status !== JOB_STATUS.IN_PROGRESS) {
    throw new AppError("Only active jobs can be canceled", 400);
  }
  if (!job.cancellation || job.cancellation.status !== CANCELLATION_STATUS.PENDING) {
    throw new AppError("No pending cancellation request", 400);
  }
  if (job.cancellation.initiatedBy?.toString() === userId) {
    throw new AppError("Initiator cannot respond to cancellation", 400);
  }
  if (action !== "accept" && action !== "reject") {
    throw new AppError("Action must be accept or reject", 400);
  }
};

const assertProposalCanCreate = (job) => {
  if (job.status !== JOB_STATUS.OPEN) {
    throw new AppError("Proposals can only be submitted for open jobs", 400);
  }
};

const assertProposalCanReject = (job, proposal) => {
  if (
    ![
      JOB_STATUS.OPEN,
      JOB_STATUS.CONTRACT_PENDING,
      JOB_STATUS.IN_PROGRESS,
    ].includes(job.status)
  ) {
    throw new AppError("Job is not open for rejection", 400);
  }
  if (proposal.status === PROPOSAL_STATUS.ACCEPTED) {
    throw new AppError("Accepted proposals cannot be rejected", 400);
  }
  if (proposal.status === PROPOSAL_STATUS.WITHDRAWN) {
    throw new AppError("Withdrawn proposals cannot be rejected", 400);
  }
  if (proposal.status === PROPOSAL_STATUS.REJECTED) {
    throw new AppError("Proposal is already rejected", 400);
  }
};

const assertProposalCanWithdraw = (proposal) => {
  if (proposal.status !== PROPOSAL_STATUS.PENDING) {
    throw new AppError("You can only withdraw pending proposals", 400);
  }
};

module.exports = {
  normalizeJobCreateStatus,
  assertJobCanUpdate,
  assertJobCanPublish,
  assertJobCanDelete,
  assertJobCanMarkCompleted,
  assertJobCanApproveCompletion,
  assertJobCanSubmitMilestone,
  assertJobCanApproveMilestone,
  assertJobCanRequestCancellation,
  assertJobCanRespondCancellation,
  assertProposalCanCreate,
  assertProposalCanReject,
  assertProposalCanWithdraw,
};
