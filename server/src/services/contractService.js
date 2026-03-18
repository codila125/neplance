const Contract = require("../models/Contract");
const AppError = require("../utils/appError");
const {
  CANCELLATION_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  JOB_STATUS,
  MILESTONE_STATUS,
  PROPOSAL_STATUS,
} = require("../constants/statuses");

const normalizeContractType = (value) =>
  value === CONTRACT_TYPE.MILESTONE_BASED
    ? CONTRACT_TYPE.MILESTONE_BASED
    : CONTRACT_TYPE.FULL_PROJECT;

const normalizeMilestones = (contractType, milestones = []) => {
  if (contractType !== CONTRACT_TYPE.MILESTONE_BASED) {
    return [];
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new AppError("Milestone-based contracts require milestones", 400);
  }

  return milestones
    .filter((milestone) => milestone?.title)
    .map((milestone) => ({
      title: milestone.title.trim(),
      description: milestone.description?.trim() || "",
      value: Number(milestone.value) || 0,
      dueDate: milestone.dueDate || undefined,
    }));
};

const createContractFromProposal = async ({
  clientId,
  job,
  payload,
  proposal,
}) => {
  if (String(job.creatorAddress) !== String(clientId)) {
    throw new AppError("Only the job creator can create a contract", 403);
  }

  if (
    ![PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(
      proposal.status
    )
  ) {
    throw new AppError(
      "Only pending or accepted proposals can be converted to a contract",
      400
    );
  }

  if (![JOB_STATUS.OPEN, JOB_STATUS.CONTRACT_PENDING].includes(job.status)) {
    throw new AppError("This job is not available for contract creation", 400);
  }

  const existingContract = await Contract.findOne({ proposal: proposal._id });
  if (existingContract) {
    return existingContract;
  }

  if (
    job.activeContract &&
    String(job.activeContract) !== String(existingContract?._id || "")
  ) {
    throw new AppError("This job already has an active contract", 400);
  }

  if (
    job.selectedProposal &&
    String(job.selectedProposal) !== String(proposal._id)
  ) {
    throw new AppError(
      "Another proposal has already been selected for this job",
      400
    );
  }

  const contractType = normalizeContractType(payload.contractType);
  const milestones = normalizeMilestones(contractType, payload.milestones);
  const totalAmount =
    contractType === CONTRACT_TYPE.MILESTONE_BASED
      ? milestones.reduce((total, milestone) => total + (Number(milestone.value) || 0), 0)
      : Number(payload.totalAmount) || proposal.amount || job.budget?.max || job.budget?.min || 0;

  if (totalAmount <= 0) {
    throw new AppError("Contract amount must be greater than zero", 400);
  }

  const contract = await Contract.create({
    job: job._id,
    proposal: proposal._id,
    client: clientId,
    freelancer: proposal.freelancer,
    title: payload.title?.trim() || job.title,
    description: payload.description?.trim() || proposal.coverLetter || job.description || "",
    contractType,
    totalAmount,
    currency: job.budget?.currency || "NPR",
    terms: payload.terms?.trim() || job.terms || "",
    milestones,
    status: CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE,
    clientSignature: {
      signedAt: new Date(),
    },
    updatedAt: new Date(),
  });

  proposal.status = PROPOSAL_STATUS.ACCEPTED;
  proposal.updatedAt = new Date();
  await proposal.save();

  job.status = JOB_STATUS.CONTRACT_PENDING;
  job.hiredFreelancer = proposal.freelancer;
  job.selectedProposal = proposal._id;
  job.activeContract = contract._id;
  job.updatedAt = new Date();

  const contractorAddress = proposal.freelancer.toString();
  const existingParties = Array.isArray(job.parties) ? job.parties : [];
  if (
    !existingParties.some(
      (party) =>
        party?.role === "CONTRACTOR" &&
        String(party.address) === contractorAddress
    )
  ) {
    existingParties.push({
      address: contractorAddress,
      role: "CONTRACTOR",
    });
  }
  job.parties = existingParties;
  await job.save();

  await proposal.constructor.updateMany(
    {
      job: job._id,
      _id: { $ne: proposal._id },
      status: PROPOSAL_STATUS.PENDING,
    },
    {
      $set: {
        status: PROPOSAL_STATUS.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: "Another proposal was converted into a contract.",
        updatedAt: new Date(),
      },
    }
  );

  return contract;
};

const signContract = async (contract, freelancerId) => {
  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can sign the contract", 403);
  }

  if (contract.status !== CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE) {
    throw new AppError("This contract is not awaiting freelancer signature", 400);
  }

  contract.freelancerSignature = {
    ...(contract.freelancerSignature || {}),
    signedAt: new Date(),
  };
  contract.status = CONTRACT_STATUS.ACTIVE;
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const getParticipantRole = (contract, userId) => {
  if (String(contract.client) === String(userId)) {
    return "CLIENT";
  }

  if (String(contract.freelancer) === String(userId)) {
    return "FREELANCER";
  }

  throw new AppError("You are not a participant in this contract", 403);
};

const ensureContractIsActive = (contract) => {
  if (contract.status !== CONTRACT_STATUS.ACTIVE) {
    throw new AppError("This contract is not active", 400);
  }
};

const submitContractMilestone = async ({
  contract,
  freelancerId,
  milestoneIndex,
  evidence,
}) => {
  ensureContractIsActive(contract);

  if (contract.contractType !== CONTRACT_TYPE.MILESTONE_BASED) {
    throw new AppError(
      "Only milestone-based contracts can submit milestones",
      400
    );
  }

  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can submit milestones", 403);
  }

  if (Number.isNaN(milestoneIndex) || milestoneIndex < 0) {
    throw new AppError("Invalid milestone index", 400);
  }

  const milestone = contract.milestones?.[milestoneIndex];
  if (!milestone) {
    throw new AppError("Milestone not found", 404);
  }

  if (milestone.status !== MILESTONE_STATUS.ACTIVE) {
    throw new AppError("Milestone is not active", 400);
  }

  milestone.status = MILESTONE_STATUS.SUBMITTED;
  milestone.completedAt = new Date();
  milestone.evidence = typeof evidence === "string" ? evidence.trim() : "";
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const approveContractMilestone = async ({
  contract,
  clientId,
  milestoneIndex,
}) => {
  ensureContractIsActive(contract);

  if (contract.contractType !== CONTRACT_TYPE.MILESTONE_BASED) {
    throw new AppError(
      "Only milestone-based contracts can approve milestones",
      400
    );
  }

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can approve milestones", 403);
  }

  if (Number.isNaN(milestoneIndex) || milestoneIndex < 0) {
    throw new AppError("Invalid milestone index", 400);
  }

  const milestone = contract.milestones?.[milestoneIndex];
  if (!milestone) {
    throw new AppError("Milestone not found", 404);
  }

  if (milestone.status !== MILESTONE_STATUS.SUBMITTED) {
    throw new AppError("Milestone has not been submitted yet", 400);
  }

  milestone.status = MILESTONE_STATUS.COMPLETED;
  milestone.approvedAt = new Date();

  const allCompleted = (contract.milestones || []).every(
    (item) => item.status === MILESTONE_STATUS.COMPLETED
  );

  if (allCompleted) {
    contract.status = CONTRACT_STATUS.COMPLETED;
    contract.completedAt = new Date();
  }

  contract.updatedAt = new Date();
  await contract.save();
  return { contract, allCompleted };
};

const submitFullProjectDelivery = async ({ contract, freelancerId, notes }) => {
  ensureContractIsActive(contract);

  if (contract.contractType !== CONTRACT_TYPE.FULL_PROJECT) {
    throw new AppError(
      "Only full-project contracts can submit final delivery",
      400
    );
  }

  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can submit delivery", 403);
  }

  contract.deliverySubmission = {
    notes: typeof notes === "string" ? notes.trim() : "",
    submittedAt: new Date(),
    submittedBy: freelancerId,
  };
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const approveContractCompletion = async ({ contract, clientId }) => {
  ensureContractIsActive(contract);

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can complete the contract", 403);
  }

  if (contract.contractType === CONTRACT_TYPE.FULL_PROJECT) {
    if (!contract.deliverySubmission?.submittedAt) {
      throw new AppError("The freelancer has not submitted final work yet", 400);
    }
  } else {
    const allCompleted = (contract.milestones || []).every(
      (item) => item.status === MILESTONE_STATUS.COMPLETED
    );
    if (!allCompleted) {
      throw new AppError("All milestones must be approved first", 400);
    }
  }

  contract.status = CONTRACT_STATUS.COMPLETED;
  contract.completedAt = new Date();
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const requestContractCancellation = async ({ contract, userId, reason }) => {
  ensureContractIsActive(contract);

  const participantRole = getParticipantRole(contract, userId);

  if (contract.cancellation?.status === CANCELLATION_STATUS.PENDING) {
    throw new AppError("Cancellation has already been requested", 400);
  }

  contract.cancellation = {
    status: CANCELLATION_STATUS.PENDING,
    initiatedBy: userId,
    initiatedRole: participantRole,
    reason: typeof reason === "string" ? reason.trim() : "",
    requestedAt: new Date(),
  };
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const respondContractCancellation = async ({ contract, userId, action }) => {
  ensureContractIsActive(contract);

  const participantRole = getParticipantRole(contract, userId);

  if (contract.cancellation?.status !== CANCELLATION_STATUS.PENDING) {
    throw new AppError("There is no pending cancellation request", 400);
  }

  if (contract.cancellation.initiatedRole === participantRole) {
    throw new AppError("The cancellation initiator cannot respond", 400);
  }

  if (!["accept", "reject"].includes(action)) {
    throw new AppError("Action must be accept or reject", 400);
  }

  const accepted = action === "accept";
  contract.cancellation.status = accepted
    ? CANCELLATION_STATUS.ACCEPTED
    : CANCELLATION_STATUS.REJECTED;
  contract.cancellation.respondedBy = userId;
  contract.cancellation.respondedAt = new Date();

  if (accepted) {
    contract.status = CONTRACT_STATUS.CANCELLED;
  }

  contract.updatedAt = new Date();
  await contract.save();
  return { contract, accepted };
};

module.exports = {
  approveContractCompletion,
  approveContractMilestone,
  createContractFromProposal,
  getParticipantRole,
  requestContractCancellation,
  respondContractCancellation,
  signContract,
  submitContractMilestone,
  submitFullProjectDelivery,
};
