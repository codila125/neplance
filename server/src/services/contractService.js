const Contract = require("../models/Contract");
const Booking = require("../models/Booking");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const AppError = require("../utils/appError");
const {
  CANCELLATION_STATUS,
  CONTRACT_FUNDING_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  JOB_STATUS,
  MILESTONE_STATUS,
  BOOKING_STATUS,
  PROPOSAL_STATUS,
} = require("../constants/statuses");
const {
  releasePendingContractFunding,
  refundContractFunds,
  releaseContractFunds,
  reserveContractFunds,
  syncPendingContractFunding,
  linkLatestFundingTransactionToContract,
  updateFundingStatus,
} = require("./walletService");
const {
  syncAcceptedCancellationToBlockchainStrict,
  syncCompletedMilestoneToBlockchain,
  syncSignedContractToBlockchain,
} = require("../blockchain/controllers/contractSyncController");

const normalizeContractType = (value) =>
  value === CONTRACT_TYPE.MILESTONE_BASED
    ? CONTRACT_TYPE.MILESTONE_BASED
    : CONTRACT_TYPE.FULL_PROJECT;

const normalizeAttachments = (attachments = []) =>
  Array.isArray(attachments)
    ? attachments
        .filter((attachment) => attachment?.url)
        .map((attachment) => ({
          name: attachment.name || "",
          url: attachment.url,
          publicId: attachment.publicId || "",
          resourceType: attachment.resourceType || "raw",
          uploadedAt: attachment.uploadedAt || new Date(),
        }))
    : [];

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

const normalizePhysicalVisit = (serviceMode, payload = {}, job = null) => {
  if (serviceMode !== "physical") {
    return {
      isRequired: false,
      verification: { status: "NOT_REQUIRED" },
    };
  }

  const jobPhysicalDetails = job?.physicalDetails || {};
  const visitPayload = payload?.physicalVisit || {};
  const isRequired = Boolean(
    visitPayload.isRequired ?? jobPhysicalDetails.siteVisitRequired
  );

  return {
    isRequired,
    preferredVisitDate:
      visitPayload.preferredVisitDate ||
      jobPhysicalDetails.preferredVisitDate ||
      undefined,
    preferredWorkDate:
      visitPayload.preferredWorkDate ||
      jobPhysicalDetails.preferredWorkDate ||
      undefined,
    inspectionSummary:
      typeof visitPayload.inspectionSummary === "string"
        ? visitPayload.inspectionSummary.trim()
        : "",
    materialsAgreement:
      typeof visitPayload.materialsAgreement === "string"
        ? visitPayload.materialsAgreement.trim()
        : jobPhysicalDetails.materialsPreference || "",
    verification: {
      status: isRequired ? "PENDING" : "NOT_REQUIRED",
    },
  };
};

const createVisitOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const ensureContractAllowsVisitVerification = (contract) => {
  if (contract.status !== CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE) {
    throw new AppError(
      "Visit verification is only available before the freelancer signs",
      400
    );
  }

  if (contract.booking) {
    throw new AppError(
      "Physical visit verification for this contract was already handled in the booking stage",
      400,
    );
  }
};

const createContractFromProposal = async ({
  clientId,
  job,
  payload,
  proposal,
}) => {
  if (job.jobType === "physical") {
    throw new AppError(
      "Physical jobs must go through a booking before a contract can be created",
      400,
    );
  }
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
  const serviceMode = job.jobType === "physical" ? "physical" : "digital";
  const milestones = normalizeMilestones(contractType, payload.milestones);
  let totalAmount =
    contractType === CONTRACT_TYPE.MILESTONE_BASED
      ? milestones.reduce((total, milestone) => total + (Number(milestone.value) || 0), 0)
      : Number(payload.totalAmount) || proposal.amount || job.budget?.max || job.budget?.min || 0;

  if (serviceMode === "physical" && Number(proposal.amount || 0) > 0) {
    const quotedAmount = Number(proposal.amount || 0);

    if (
      contractType === CONTRACT_TYPE.MILESTONE_BASED &&
      totalAmount !== quotedAmount
    ) {
      throw new AppError(
        "Physical contract milestones must add up to the freelancer's quoted amount",
        400
      );
    }

    totalAmount = quotedAmount;
  }

  if (totalAmount <= 0) {
    throw new AppError("Contract amount must be greater than zero", 400);
  }

  const contractTitle = payload.title?.trim() || job.title;
  const contractDescription =
    payload.description?.trim() || job.description || "";

  await reserveContractFunds({
    clientId,
    contractId: proposal._id,
    contractTitle,
    amount: totalAmount,
  });

  let contract;

  try {
    contract = await Contract.create({
      job: job._id,
      proposal: proposal._id,
      client: clientId,
      freelancer: proposal.freelancer,
      title: contractTitle,
      description: contractDescription,
      serviceMode,
      contractType,
      totalAmount,
      fundingStatus: CONTRACT_FUNDING_STATUS.FUNDED,
      fundedAmount: totalAmount,
      releasedAmount: 0,
      refundedAmount: 0,
      fundedAt: new Date(),
      currency: job.budget?.currency || "NPR",
      terms: payload.terms?.trim() || job.terms || "",
      physicalVisit: normalizePhysicalVisit(serviceMode, payload, job),
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

    await linkLatestFundingTransactionToContract({
      clientId,
      contractId: contract._id,
      contractTitle,
      amount: totalAmount,
    });
  } catch (error) {
    const rollbackContract = new Contract({
      client: clientId,
      freelancer: proposal.freelancer,
      fundedAmount: totalAmount,
      releasedAmount: 0,
      refundedAmount: 0,
    });
    await refundContractFunds({
      contract: rollbackContract,
      amount: totalAmount,
      description: `Contract funding rolled back for "${contractTitle}"`,
    });
    throw error;
  }

  return contract;
};

const signContract = async (contract, freelancerId) => {
  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can sign the contract", 403);
  }

  const [freelancer, client] = await Promise.all([
    User.findById(freelancerId).select("walletId"),
    User.findById(contract.client).select("walletId"),
  ]);

  if (!freelancer?.walletId) {
    throw new AppError("Freelancer must have a wallet id before signing", 400);
  }

  if (!client?.walletId) {
    throw new AppError("Client must have a wallet id before contract signing", 400);
  }

  if (contract.status !== CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE) {
    throw new AppError("This contract is not awaiting freelancer signature", 400);
  }

  if (
    ![
      CONTRACT_FUNDING_STATUS.FUNDED,
      CONTRACT_FUNDING_STATUS.PARTIALLY_RELEASED,
    ].includes(contract.fundingStatus)
  ) {
    throw new AppError(
      "This contract is not fully funded yet and cannot be signed",
      400
    );
  }

  if (
    contract.serviceMode === "physical" &&
    contract.physicalVisit?.isRequired &&
    contract.physicalVisit?.verification?.status !== "VERIFIED"
  ) {
    throw new AppError(
      "Physical contracts can only be signed after on-site OTP verification",
      400
    );
  }

  contract.freelancerSignature = {
    ...(contract.freelancerSignature || {}),
    rejectedAt: undefined,
    rejectionReason: "",
    signedAt: new Date(),
  };
  contract.status = CONTRACT_STATUS.ACTIVE;
  contract.updatedAt = new Date();
  await contract.save();

  try {
    await syncSignedContractToBlockchain(contract._id);
  } catch (error) {
    contract.freelancerSignature = {
      ...(contract.freelancerSignature || {}),
      signedAt: undefined,
    };
    contract.status = CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE;
    contract.updatedAt = new Date();
    await contract.save();

    throw new AppError(
      error?.message || "Contract signing failed due to blockchain sync error",
      error?.statusCode || 502
    );
  }

  return contract;
};

const withBlockchainRollback = async ({
  contract,
  apply,
  rollback,
  blockchainAction,
  errorMessage,
}) => {
  await apply();

  try {
    await blockchainAction();
  } catch (error) {
    await rollback();
    throw new AppError(error?.message || errorMessage, error?.statusCode || 502);
  }
};

const ensurePendingFreelancerSignature = (contract) => {
  if (contract.status !== CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE) {
    throw new AppError(
      "This contract can only be changed before the freelancer signs",
      400
    );
  }
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
  evidenceAttachments,
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
  milestone.evidenceAttachments = normalizeAttachments(evidenceAttachments);
  milestone.revisionRequestedAt = undefined;
  milestone.revisionRequestedBy = undefined;
  milestone.revisionNotes = "";
  milestone.submissionHistory = [
    ...(Array.isArray(milestone.submissionHistory)
      ? milestone.submissionHistory
      : []),
    {
      notes: milestone.evidence,
      attachments: milestone.evidenceAttachments,
      submittedAt: milestone.completedAt,
      submittedBy: freelancerId,
      submittedByRole: "FREELANCER",
    },
  ];
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

  const previousContractStatus = contract.status;
  const previousCompletedAt = contract.completedAt;

  await withBlockchainRollback({
    contract,
    apply: async () => {
      milestone.status = MILESTONE_STATUS.COMPLETED;
      milestone.approvedAt = new Date();
      contract.updatedAt = new Date();
      await contract.save();
    },
    rollback: async () => {
      milestone.status = MILESTONE_STATUS.SUBMITTED;
      milestone.approvedAt = undefined;
      contract.status = previousContractStatus;
      contract.completedAt = previousCompletedAt;
      contract.updatedAt = new Date();
      await contract.save();
    },
    blockchainAction: async () => {
      await syncCompletedMilestoneToBlockchain({
        contractId: contract._id,
        milestoneIndex,
      });
    },
    errorMessage: "Milestone approval failed due to blockchain sync error",
  });

  await releaseContractFunds({
    contract,
    amount: milestone.value,
    description: `Released funds for milestone "${milestone.title}"`,
  });

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

const submitFullProjectDelivery = async ({
  contract,
  freelancerId,
  notes,
  attachments,
}) => {
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

  const normalizedAttachments = normalizeAttachments(attachments);
  const submissionNotes = typeof notes === "string" ? notes.trim() : "";
  const submittedAt = new Date();

  contract.deliverySubmission = {
    status: "SUBMITTED",
    notes: submissionNotes,
    attachments: normalizedAttachments,
    submittedAt,
    submittedBy: freelancerId,
    revisionRequestedAt: undefined,
    revisionRequestedBy: undefined,
    revisionNotes: "",
    revisionHistory: Array.isArray(contract.deliverySubmission?.revisionHistory)
      ? contract.deliverySubmission.revisionHistory
      : [],
    submissionHistory: [
      ...(Array.isArray(contract.deliverySubmission?.submissionHistory)
        ? contract.deliverySubmission.submissionHistory
        : []),
      {
        notes: submissionNotes,
        attachments: normalizedAttachments,
        submittedAt,
        submittedBy: freelancerId,
        submittedByRole: "FREELANCER",
      },
    ],
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
    if (contract.deliverySubmission?.status === "CHANGES_REQUESTED") {
      throw new AppError("The freelancer must address requested changes first", 400);
    }
  } else {
    const allCompleted = (contract.milestones || []).every(
      (item) => item.status === MILESTONE_STATUS.COMPLETED
    );
    if (!allCompleted) {
      throw new AppError("All milestones must be approved first", 400);
    }
  }

  const hasMilestones = Array.isArray(contract.milestones) && contract.milestones.length > 0;
  if (!hasMilestones) {
    await withBlockchainRollback({
      contract,
      apply: async () => {},
      rollback: async () => {},
      blockchainAction: async () => {
        await syncCompletedMilestoneToBlockchain({
          contractId: contract._id,
          milestoneIndex: 0,
        });
      },
      errorMessage: "Contract completion failed due to blockchain milestone sync error",
    });
  }

  const unreleasedAmount =
    Number(contract.fundedAmount || 0) -
    Number(contract.releasedAmount || 0) -
    Number(contract.refundedAmount || 0);

  if (unreleasedAmount > 0) {
    await releaseContractFunds({
      contract,
      amount: unreleasedAmount,
      description: `Released final payment for contract "${contract.title}"`,
    });
  }

  contract.status = CONTRACT_STATUS.COMPLETED;
  contract.completedAt = new Date();
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const requestContractMilestoneChanges = async ({
  contract,
  clientId,
  milestoneIndex,
  notes,
}) => {
  ensureContractIsActive(contract);

  if (contract.contractType !== CONTRACT_TYPE.MILESTONE_BASED) {
    throw new AppError(
      "Only milestone-based contracts can request milestone changes",
      400
    );
  }

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can request milestone changes", 403);
  }

  const milestone = contract.milestones?.[milestoneIndex];
  if (!milestone) {
    throw new AppError("Milestone not found", 404);
  }

  if (milestone.status !== MILESTONE_STATUS.SUBMITTED) {
    throw new AppError("Only submitted milestones can be revised", 400);
  }

  milestone.status = MILESTONE_STATUS.ACTIVE;
  milestone.revisionRequestedAt = new Date();
  milestone.revisionRequestedBy = clientId;
  milestone.revisionNotes = typeof notes === "string" ? notes.trim() : "";
  milestone.revisionHistory = [
    ...(Array.isArray(milestone.revisionHistory)
      ? milestone.revisionHistory
      : []),
    {
      notes: milestone.revisionNotes,
      requestedAt: milestone.revisionRequestedAt,
      requestedBy: clientId,
      requestedByRole: "CLIENT",
    },
  ];
  contract.updatedAt = new Date();
  await contract.save();
  return contract;
};

const requestContractDeliveryChanges = async ({ contract, clientId, notes }) => {
  ensureContractIsActive(contract);

  if (contract.contractType !== CONTRACT_TYPE.FULL_PROJECT) {
    throw new AppError(
      "Only full-project contracts can request delivery changes",
      400
    );
  }

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can request delivery changes", 403);
  }

  if (!contract.deliverySubmission?.submittedAt) {
    throw new AppError("Final work has not been submitted yet", 400);
  }

  contract.deliverySubmission.status = "CHANGES_REQUESTED";
  contract.deliverySubmission.revisionRequestedAt = new Date();
  contract.deliverySubmission.revisionRequestedBy = clientId;
  contract.deliverySubmission.revisionNotes =
    typeof notes === "string" ? notes.trim() : "";
  contract.deliverySubmission.revisionHistory = [
    ...(Array.isArray(contract.deliverySubmission.revisionHistory)
      ? contract.deliverySubmission.revisionHistory
      : []),
    {
      notes: contract.deliverySubmission.revisionNotes,
      requestedAt: contract.deliverySubmission.revisionRequestedAt,
      requestedBy: clientId,
      requestedByRole: "CLIENT",
    },
  ];
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
    await syncAcceptedCancellationToBlockchainStrict({ contractId: contract._id });

    const refundableAmount =
      Number(contract.fundedAmount || 0) -
      Number(contract.releasedAmount || 0) -
      Number(contract.refundedAmount || 0);

    if (refundableAmount > 0) {
      await refundContractFunds({
        contract,
        amount: refundableAmount,
        description: `Refunded held balance for cancelled contract "${contract.title}"`,
      });
    }

    contract.status = CONTRACT_STATUS.CANCELLED;
  }

  contract.updatedAt = new Date();
  updateFundingStatus(contract);
  await contract.save();
  return { contract, accepted };
};

const updatePendingContract = async ({ clientId, contract, payload }) => {
  ensurePendingFreelancerSignature(contract);

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can update this contract", 403);
  }

  const contractType =
    contract.serviceMode === "physical"
      ? CONTRACT_TYPE.FULL_PROJECT
      : normalizeContractType(payload.contractType);
  const serviceMode = contract.serviceMode || "digital";
  const milestones =
    serviceMode === "physical"
      ? []
      : normalizeMilestones(contractType, payload.milestones);
  let totalAmount =
    contractType === CONTRACT_TYPE.MILESTONE_BASED
      ? milestones.reduce(
          (total, milestone) => total + (Number(milestone.value) || 0),
          0
        )
      : Number(payload.totalAmount) || 0;

  if (serviceMode === "physical" && Number(contract.totalAmount || 0) > 0) {
    totalAmount = Number(contract.totalAmount || 0);
  }

  if (totalAmount <= 0) {
    throw new AppError("Contract amount must be greater than zero", 400);
  }

  await syncPendingContractFunding({
    clientId,
    contract,
    nextFundedAmount: totalAmount,
    description: `Adjusted funding for contract "${payload.title?.trim() || contract.title}"`,
  });

  contract.title = payload.title?.trim() || contract.title;
  contract.description = payload.description?.trim() || "";
  contract.terms = payload.terms?.trim() || "";
  contract.serviceMode = serviceMode;
  contract.physicalVisit = normalizePhysicalVisit(serviceMode, payload, null);
  contract.contractType = contractType;
  contract.totalAmount = totalAmount;
  contract.milestones = milestones;
  contract.freelancerSignature = {
    ...(contract.freelancerSignature || {}),
    rejectedAt: undefined,
    rejectionReason: "",
  };
  contract.updatedAt = new Date();
  await contract.save();

  return contract;
};

const generateContractVisitOtp = async ({ contract, clientId }) => {
  ensureContractAllowsVisitVerification(contract);

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can generate the visit OTP", 403);
  }

  if (contract.serviceMode !== "physical") {
    throw new AppError("Visit OTP is only available for physical contracts", 400);
  }

  if (!contract.physicalVisit?.isRequired) {
    throw new AppError("This contract does not require physical visit verification", 400);
  }

  contract.physicalVisit = contract.physicalVisit || {};
  contract.physicalVisit.verification = {
    ...(contract.physicalVisit.verification || {}),
    status: "PENDING",
    otpCode: createVisitOtpCode(),
    generatedAt: new Date(),
    generatedBy: clientId,
    verifiedAt: undefined,
    verifiedBy: undefined,
  };
  contract.updatedAt = new Date();
  await contract.save();

  return contract;
};

const createContractFromBooking = async ({
  clientId,
  booking,
  payload,
}) => {
  if (String(booking.client) !== String(clientId)) {
    throw new AppError("Only the booking client can create a contract", 403);
  }

  if (booking.contract) {
    const existingContract = await Contract.findById(booking.contract);
    if (existingContract) {
      return existingContract;
    }
  }

  if (booking.status !== BOOKING_STATUS.QUOTED) {
    throw new AppError(
      "The freelancer must finish the booking and submit a quote before contract creation",
      400,
    );
  }

  const [job, proposal] = await Promise.all([
    Job.findById(booking.job),
    Proposal.findById(booking.proposal),
  ]);

  if (!job || !proposal) {
    throw new AppError("Booking data is incomplete", 400);
  }

  if (job.activeContract) {
    throw new AppError("This job already has an active contract", 400);
  }

  const contractType = CONTRACT_TYPE.FULL_PROJECT;
  const serviceMode = "physical";
  const milestones = [];
  const lockedQuoteAmount = Number(booking.quoteAmount || 0);
  let totalAmount = lockedQuoteAmount;

  if (lockedQuoteAmount <= 0) {
    throw new AppError(
      "A valid freelancer quote is required before contract creation",
      400,
    );
  }

  totalAmount = lockedQuoteAmount;

  const contractTitle = payload.title?.trim() || job.title;
  const contractDescription =
    payload.description?.trim() || job.description || "";

  await reserveContractFunds({
    clientId,
    contractId: booking._id,
    contractTitle,
    amount: totalAmount,
  });

  let contract;

  try {
    contract = await Contract.create({
      job: job._id,
      proposal: proposal._id,
      booking: booking._id,
      client: clientId,
      freelancer: booking.freelancer,
      title: contractTitle,
      description: contractDescription,
      serviceMode,
      contractType,
      totalAmount,
      fundingStatus: CONTRACT_FUNDING_STATUS.FUNDED,
      fundedAmount: totalAmount,
      releasedAmount: 0,
      refundedAmount: 0,
      fundedAt: new Date(),
      currency: job.budget?.currency || "NPR",
      terms: payload.terms?.trim() || job.terms || "",
      physicalVisit: {
        isRequired: Boolean(booking.requiresVisit),
        preferredVisitDate:
          booking.scheduledFor || job.physicalDetails?.preferredVisitDate || undefined,
        preferredWorkDate:
          job.physicalDetails?.preferredWorkDate || undefined,
        inspectionSummary:
          payload.physicalVisit?.inspectionSummary?.trim() ||
          booking.quoteNotes ||
          "",
        materialsAgreement:
          payload.physicalVisit?.materialsAgreement?.trim() ||
          job.physicalDetails?.materialsPreference ||
          "",
        verification: {
          status: booking.requiresVisit
            ? booking.visitVerification?.status || "PENDING"
            : "NOT_REQUIRED",
          generatedAt: booking.visitVerification?.generatedAt,
          generatedBy: booking.visitVerification?.generatedBy,
          verifiedAt: booking.visitVerification?.verifiedAt,
          verifiedBy: booking.visitVerification?.verifiedBy,
        },
      },
      milestones,
      status: CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE,
      clientSignature: {
        signedAt: new Date(),
      },
      updatedAt: new Date(),
    });

    booking.contract = contract._id;
    booking.status = BOOKING_STATUS.CONTRACT_CREATED;
    booking.updatedAt = new Date();
    await booking.save();

    proposal.status = PROPOSAL_STATUS.ACCEPTED;
    proposal.updatedAt = new Date();
    await proposal.save();

    job.status = JOB_STATUS.CONTRACT_PENDING;
    job.hiredFreelancer = booking.freelancer;
    job.selectedProposal = proposal._id;
    job.activeBooking = booking._id;
    job.activeContract = contract._id;
    job.updatedAt = new Date();

    const contractorAddress = booking.freelancer.toString();
    const existingParties = Array.isArray(job.parties) ? job.parties : [];
    if (
      !existingParties.some(
        (party) =>
          party?.role === "CONTRACTOR" &&
          String(party.address) === contractorAddress,
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
          rejectionReason: "Another proposal moved forward to contract.",
          updatedAt: new Date(),
        },
      },
    );

    await linkLatestFundingTransactionToContract({
      clientId,
      contractId: contract._id,
      contractTitle,
      amount: totalAmount,
    });
  } catch (error) {
    const rollbackContract = new Contract({
      client: clientId,
      freelancer: booking.freelancer,
      fundedAmount: totalAmount,
      releasedAmount: 0,
      refundedAmount: 0,
    });
    await refundContractFunds({
      contract: rollbackContract,
      amount: totalAmount,
      description: `Contract funding rolled back for "${contractTitle}"`,
    });
    throw error;
  }

  return contract;
};

const verifyContractVisitOtp = async ({ contract, freelancerId, otpCode }) => {
  ensureContractAllowsVisitVerification(contract);

  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can verify the visit OTP", 403);
  }

  if (contract.serviceMode !== "physical" || !contract.physicalVisit?.isRequired) {
    throw new AppError("This contract does not support physical visit verification", 400);
  }

  const expectedCode = String(contract.physicalVisit?.verification?.otpCode || "");
  if (!expectedCode) {
    throw new AppError("The client has not generated an OTP yet", 400);
  }

  if (String(otpCode || "").trim() !== expectedCode) {
    throw new AppError("Invalid OTP code", 400);
  }

  contract.physicalVisit.verification = {
    ...(contract.physicalVisit.verification || {}),
    status: "VERIFIED",
    otpCode: undefined,
    verifiedAt: new Date(),
    verifiedBy: freelancerId,
  };
  contract.updatedAt = new Date();
  await contract.save();

  return contract;
};

const rejectPendingContract = async ({ contract, freelancerId, reason }) => {
  ensurePendingFreelancerSignature(contract);

  if (String(contract.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the assigned freelancer can reject this contract", 403);
  }

  contract.freelancerSignature = {
    ...(contract.freelancerSignature || {}),
    rejectedAt: new Date(),
    rejectionReason: typeof reason === "string" ? reason.trim() : "",
    signedAt: undefined,
    signatureHash: undefined,
    walletAddress: undefined,
  };
  contract.updatedAt = new Date();
  await contract.save();

  return contract;
};

const cancelPendingContract = async ({ clientId, contract, job }) => {
  ensurePendingFreelancerSignature(contract);

  if (String(contract.client) !== String(clientId)) {
    throw new AppError("Only the client can cancel this pending contract", 403);
  }

  await releasePendingContractFunding({
    clientId,
    contract,
    description: `Cancelled pending contract "${contract.title}" before freelancer signature`,
  });

  if (String(job.activeContract || "") === String(contract._id)) {
    job.activeContract = undefined;
  }
  if (contract.booking && String(job.activeBooking || "") === String(contract.booking)) {
    job.activeBooking = contract.booking;
  }
  if (String(job.selectedProposal || "") === String(contract.proposal || "")) {
    job.selectedProposal = undefined;
  }
  if (
    String(job.hiredFreelancer || "") === String(contract.freelancer || "")
  ) {
    job.hiredFreelancer = undefined;
  }
  if (Array.isArray(job.parties)) {
    job.parties = job.parties.filter(
      (party) =>
        !(
          party?.role === "CONTRACTOR" &&
          String(party.address) === String(contract.freelancer || "")
        ),
    );
  }
  job.status = JOB_STATUS.OPEN;
  job.updatedAt = new Date();
  await job.save();

  await Proposal.findByIdAndUpdate(contract.proposal, {
    $set: {
      status: PROPOSAL_STATUS.PENDING,
      updatedAt: new Date(),
    },
    $unset: {
      rejectedAt: 1,
      rejectionReason: 1,
      withdrawnAt: 1,
    },
  });

  if (contract.booking) {
    await Booking.findByIdAndUpdate(contract.booking, {
      $set: {
        status: BOOKING_STATUS.QUOTED,
        contract: undefined,
        updatedAt: new Date(),
      },
    });
    job.status = JOB_STATUS.BOOKING_PENDING;
    await job.save();
  }

  await contract.deleteOne();

  return job;
};

module.exports = {
  approveContractCompletion,
  approveContractMilestone,
  cancelPendingContract,
  createContractFromProposal,
  createContractFromBooking,
  getParticipantRole,
  rejectPendingContract,
  requestContractCancellation,
  requestContractDeliveryChanges,
  requestContractMilestoneChanges,
  respondContractCancellation,
  signContract,
  submitContractMilestone,
  submitFullProjectDelivery,
  generateContractVisitOtp,
  verifyContractVisitOtp,
  updatePendingContract,
};
