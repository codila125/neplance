const Contract = require("../models/Contract");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const {
  CONTRACT_TYPE,
  JOB_STATUS,
} = require("../constants/statuses");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { createNotification } = require("../services/notificationService");
const {
  approveContractCompletion,
  approveContractMilestone,
  createContractFromProposal,
  requestContractCancellation,
  respondContractCancellation,
  signContract,
  submitContractMilestone,
  submitFullProjectDelivery,
} = require("../services/contractService");

const populateContract = (query) =>
  query
    .populate("client", "name email")
    .populate("freelancer", "name email")
    .populate("job", "title status budget creatorAddress selectedProposal activeContract hiredFreelancer")
    .populate("proposal", "amount deliveryDays status coverLetter");

const listMyContracts = catchAsync(async (req, res) => {
  const data = await populateContract(
    Contract.find({
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    }).sort({ createdAt: -1 })
  );

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});

const getContractById = catchAsync(async (req, res) => {
  const data = await populateContract(
    Contract.findOne({
      _id: req.params.id,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    })
  );

  if (!data) {
    throw new AppError("Contract not found", 404);
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

const getContractByProposal = catchAsync(async (req, res) => {
  const data = await populateContract(
    Contract.findOne({
      proposal: req.params.proposalId,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    })
  );

  res.status(200).json({
    status: "success",
    data,
  });
});

const createContract = catchAsync(async (req, res) => {
  const proposal = await Proposal.findById(req.params.proposalId);
  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const job = await Job.findById(proposal.job);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const contract = await createContractFromProposal({
    clientId: req.user.id,
    job,
    payload: req.body,
    proposal,
  });

  const data = await populateContract(Contract.findById(contract._id));

  await createNotification({
    recipient: proposal.freelancer,
    actor: req.user.id,
    type: "contract.created",
    title: "Contract created",
    message: `A contract was created for "${job.title}". Review and sign it to start work.`,
    link: `/contracts/${contract._id}`,
    metadata: {
      job: job._id,
      proposal: proposal._id,
    },
  });

  res.status(201).json({
    status: "success",
    data,
  });
});

const signMyContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await signContract(contract, req.user.id);
  const job = await Job.findById(updatedContract.job);

  if (job) {
    job.status = JOB_STATUS.IN_PROGRESS;
    job.updatedAt = new Date();
    await job.save();
  }

  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.client,
    actor: req.user.id,
    type: "contract.signed",
    title: "Contract signed",
    message: `The freelancer signed the contract for "${job?.title || "your job"}".`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      job: job?._id,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const submitMyMilestone = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const milestoneIndex = Number(req.params.index);
  const updatedContract = await submitContractMilestone({
    contract,
    freelancerId: req.user.id,
    milestoneIndex,
    evidence: req.body?.evidence,
  });

  const milestone = updatedContract.milestones?.[milestoneIndex];
  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.client,
    actor: req.user.id,
    type: "contract.milestone_submitted",
    title: "Milestone submitted",
    message: `${req.user.name || "Your freelancer"} submitted milestone "${milestone?.title || `#${milestoneIndex + 1}`}" for "${updatedContract.title}".`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const approveMyMilestone = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const milestoneIndex = Number(req.params.index);
  const { contract: updatedContract, allCompleted } =
    await approveContractMilestone({
      contract,
      clientId: req.user.id,
      milestoneIndex,
    });

  if (allCompleted) {
    const job = await Job.findById(updatedContract.job);
    if (job) {
      job.status = JOB_STATUS.COMPLETED;
      job.updatedAt = new Date();
      await job.save();
    }
  }

  const milestone = updatedContract.milestones?.[milestoneIndex];
  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.freelancer,
    actor: req.user.id,
    type: allCompleted
      ? "contract.completed"
      : "contract.milestone_approved",
    title: allCompleted ? "Contract completed" : "Milestone approved",
    message: allCompleted
      ? `Your contract "${updatedContract.title}" is now complete.`
      : `Your milestone "${milestone?.title || `#${milestoneIndex + 1}`}" was approved.`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const submitContractWork = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await submitFullProjectDelivery({
    contract,
    freelancerId: req.user.id,
    notes: req.body?.notes,
  });

  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.client,
    actor: req.user.id,
    type: "contract.delivery_submitted",
    title: "Final work submitted",
    message: `${req.user.name || "Your freelancer"} submitted final work for "${updatedContract.title}".`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const completeMyContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await approveContractCompletion({
    contract,
    clientId: req.user.id,
  });

  const job = await Job.findById(updatedContract.job);
  if (job) {
    job.status = JOB_STATUS.COMPLETED;
    job.updatedAt = new Date();
    await job.save();
  }

  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.freelancer,
    actor: req.user.id,
    type: "contract.completed",
    title: "Contract completed",
    message: `Your contract "${updatedContract.title}" has been marked complete.`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const requestMyContractCancellation = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await requestContractCancellation({
    contract,
    userId: req.user.id,
    reason: req.body?.reason,
  });

  const recipient =
    String(updatedContract.client) === String(req.user.id)
      ? updatedContract.freelancer
      : updatedContract.client;

  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient,
    actor: req.user.id,
    type: "contract.cancellation_requested",
    title: "Contract cancellation requested",
    message: `${req.user.name || "A user"} requested cancellation for "${updatedContract.title}".`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const respondMyContractCancellation = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const { contract: updatedContract, accepted } =
    await respondContractCancellation({
      contract,
      userId: req.user.id,
      action: req.body?.action,
    });

  const job = await Job.findById(updatedContract.job);
  if (job && accepted) {
    job.status = JOB_STATUS.CANCELLED;
    job.updatedAt = new Date();
    await job.save();
  }

  const data = await populateContract(Contract.findById(updatedContract._id));

  await createNotification({
    recipient: updatedContract.cancellation?.initiatedBy,
    actor: req.user.id,
    type: accepted
      ? "contract.cancellation_accepted"
      : "contract.cancellation_rejected",
    title: accepted ? "Cancellation accepted" : "Cancellation rejected",
    message: accepted
      ? `Your cancellation request for "${updatedContract.title}" was accepted.`
      : `Your cancellation request for "${updatedContract.title}" was rejected.`,
    link: `/contracts/${updatedContract._id}`,
    metadata: {
      contract: updatedContract._id,
      job: updatedContract.job,
      proposal: updatedContract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports = {
  approveMyMilestone,
  completeMyContract,
  createContract,
  getContractById,
  getContractByProposal,
  listMyContracts,
  requestMyContractCancellation,
  respondMyContractCancellation,
  signMyContract,
  submitContractWork,
  submitMyMilestone,
};
