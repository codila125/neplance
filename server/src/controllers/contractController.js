const Contract = require("../models/Contract");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const {
  CONTRACT_TYPE,
  JOB_STATUS,
} = require("../constants/statuses");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  createAdminNotifications,
  createNotification,
} = require("../services/notificationService");
const { createAdminConversationForDispute } = require("../services/chatService");
const {
  createContractReview,
  listContractReviews,
} = require("../services/reviewService");
const {
  createContractDispute,
  listDisputesForContracts,
} = require("../services/disputeService");
const {
  approveContractCompletion,
  approveContractMilestone,
  cancelPendingContract,
  createContractFromProposal,
  rejectPendingContract,
  requestContractCancellation,
  requestContractDeliveryChanges,
  requestContractMilestoneChanges,
  respondContractCancellation,
  signContract,
  submitContractMilestone,
  submitFullProjectDelivery,
  updatePendingContract,
} = require("../services/contractService");

const populateContract = (query) =>
  query
    .populate("client", "name email avatar")
    .populate("freelancer", "name email avatar bio experienceLevel availabilityStatus skills")
    .populate(
      "job",
      "title description status budget attachments category subcategory tags requiredSkills experienceLevel deadline location terms creatorAddress selectedProposal activeContract hiredFreelancer"
    )
    .populate("proposal", "amount deliveryDays status coverLetter attachments");

const attachReviewsToContract = async (contractDoc) => {
  if (!contractDoc) {
    return null;
  }

  const [reviews, disputes] = await Promise.all([
    listContractReviews(contractDoc._id),
    listDisputesForContracts([contractDoc._id]),
  ]);

  return {
    ...contractDoc.toObject(),
    reviews,
    disputes: disputes || [],
  };
};

const attachReviewsToContracts = async (contractDocs) => {
  if (!Array.isArray(contractDocs) || contractDocs.length === 0) {
    return [];
  }

  const contractIds = contractDocs.map((contract) => contract._id);
  const [reviews, disputes] = await Promise.all([
    Review.find({ contract: { $in: contractIds } })
      .populate("reviewer", "name email avatar")
      .populate("reviewee", "name email avatar")
      .sort({ createdAt: -1 }),
    listDisputesForContracts(contractIds),
  ]);

  const reviewMap = reviews.reduce((acc, review) => {
    const key = String(review.contract);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(review);
    return acc;
  }, {});

  const disputeMap = disputes.reduce((acc, dispute) => {
    const key = String(dispute.contract);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(dispute);
    return acc;
  }, {});

  return contractDocs.map((contract) => ({
    ...contract.toObject(),
    reviews: reviewMap[String(contract._id)] || [],
    disputes: disputeMap[String(contract._id)] || [],
  }));
};

const listMyContracts = catchAsync(async (req, res) => {
  const contracts = await populateContract(
    Contract.find({
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    }).sort({ createdAt: -1 })
  );
  const data = await attachReviewsToContracts(contracts);

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});

const getContractById = catchAsync(async (req, res) => {
  const contract = await populateContract(
    Contract.findOne({
      _id: req.params.id,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    })
  );

  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const data = await attachReviewsToContract(contract);

  res.status(200).json({
    status: "success",
    data,
  });
});

const getAdminContractById = catchAsync(async (req, res) => {
  const contract = await populateContract(Contract.findById(req.params.id));

  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const data = await attachReviewsToContract(contract);

  res.status(200).json({
    status: "success",
    data,
  });
});

const getContractByProposal = catchAsync(async (req, res) => {
  const contract = await populateContract(
    Contract.findOne({
      proposal: req.params.proposalId,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    })
  );

  const data = await attachReviewsToContract(contract);

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

  const populatedContract = await populateContract(Contract.findById(contract._id));
  const data = await attachReviewsToContract(populatedContract);

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

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

const updateMyPendingContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await updatePendingContract({
    clientId: req.user.id,
    contract,
    payload: req.body,
  });

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

  await createNotification({
    recipient: updatedContract.freelancer,
    actor: req.user.id,
    type: "contract.updated",
    title: "Contract updated",
    message: `The contract "${updatedContract.title}" was updated. Review the revised terms.`,
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

const rejectMyPendingContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await rejectPendingContract({
    contract,
    freelancerId: req.user.id,
    reason: req.body?.reason,
  });

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

  await createNotification({
    recipient: updatedContract.client,
    actor: req.user.id,
    type: "contract.rejected",
    title: "Contract changes requested",
    message: `${req.user.name || "The freelancer"} rejected the current contract and asked for revisions.`,
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

const cancelMyPendingContract = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const job = await Job.findById(contract.job);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  await cancelPendingContract({
    clientId: req.user.id,
    contract,
    job,
  });

  await createNotification({
    recipient: contract.freelancer,
    actor: req.user.id,
    type: "contract.cancelled",
    title: "Pending contract cancelled",
    message: `The client cancelled the pending contract for "${contract.title}".`,
    link: `/proposals/${contract.proposal}`,
    metadata: {
      job: contract.job,
      proposal: contract.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      cancelled: true,
      proposalId: contract.proposal,
      jobId: contract.job,
    },
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
    evidenceAttachments: req.body?.evidenceAttachments,
  });

  const milestone = updatedContract.milestones?.[milestoneIndex];
  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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
  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

const requestMilestoneChanges = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const milestoneIndex = Number(req.params.index);
  const updatedContract = await requestContractMilestoneChanges({
    contract,
    clientId: req.user.id,
    milestoneIndex,
    notes: req.body?.notes,
  });

  const milestone = updatedContract.milestones?.[milestoneIndex];
  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

  await createNotification({
    recipient: updatedContract.freelancer,
    actor: req.user.id,
    type: "contract.milestone_changes_requested",
    title: "Milestone changes requested",
    message: `Changes were requested for milestone "${milestone?.title || `#${milestoneIndex + 1}`}".`,
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
    attachments: req.body?.attachments,
  });

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

const requestContractWorkChanges = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const updatedContract = await requestContractDeliveryChanges({
    contract,
    clientId: req.user.id,
    notes: req.body?.notes,
  });

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

  await createNotification({
    recipient: updatedContract.freelancer,
    actor: req.user.id,
    type: "contract.delivery_changes_requested",
    title: "Delivery changes requested",
    message: `Changes were requested for the final delivery of "${updatedContract.title}".`,
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

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

  const populatedContract = await populateContract(
    Contract.findById(updatedContract._id)
  );
  const data = await attachReviewsToContract(populatedContract);

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

const createMyContractReview = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const review = await createContractReview({
    contract,
    reviewerId: req.user.id,
    rating: req.body?.rating,
    comment: req.body?.comment,
  });

  const reviewRecipient =
    String(review.reviewee) === String(contract.client)
      ? contract.client
      : contract.freelancer;

  await createNotification({
    recipient: reviewRecipient,
    actor: req.user.id,
    type: "contract.review_submitted",
    title: "New review received",
    message: `${req.user.name || "A user"} left you a review for "${contract.title}".`,
    link: `/contracts/${contract._id}`,
    metadata: {
      contract: contract._id,
      job: contract.job,
      proposal: contract.proposal,
      review: review._id,
    },
  });

  const populatedContract = await populateContract(Contract.findById(contract._id));
  const data = await attachReviewsToContract(populatedContract);

  res.status(201).json({
    status: "success",
    data,
  });
});

const createMyContractDispute = catchAsync(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError("Contract not found", 404);
  }

  const dispute = await createContractDispute({
    contract,
    userId: req.user.id,
    payload: req.body,
  });
  const adminConversation = await createAdminConversationForDispute(
    dispute,
    req.user.id
  );

  const otherParty =
    String(contract.client) === String(req.user.id)
      ? contract.freelancer
      : contract.client;

  await createNotification({
    recipient: otherParty,
    actor: req.user.id,
    type: "contract.dispute_created",
    title: "Contract dispute opened",
    message: `${req.user.name || "A user"} opened a dispute for "${contract.title}".`,
    link: `/contracts/${contract._id}`,
    metadata: {
      contract: contract._id,
      job: contract.job,
      proposal: contract.proposal,
      dispute: dispute._id,
    },
  });

  await createAdminNotifications({
    actor: req.user.id,
    type: "admin.dispute_created",
    title: "New dispute opened",
    message: `${req.user.name || "A user"} opened a dispute for "${contract.title}".`,
    link: adminConversation
      ? `/messages/${adminConversation._id}`
      : "/admin/disputes",
    metadata: {
      contract: contract._id,
      job: contract.job,
      proposal: contract.proposal,
      dispute: dispute._id,
    },
  });

  const populatedContract = await populateContract(Contract.findById(contract._id));
  const data = await attachReviewsToContract(populatedContract);

  res.status(201).json({
    status: "success",
    data,
  });
});

module.exports = {
  approveMyMilestone,
  cancelMyPendingContract,
  completeMyContract,
  createContract,
  createMyContractDispute,
  getAdminContractById,
  getContractById,
  getContractByProposal,
  listMyContracts,
  rejectMyPendingContract,
  requestContractWorkChanges,
  requestMyContractCancellation,
  requestMilestoneChanges,
  respondMyContractCancellation,
  signMyContract,
  submitContractWork,
  submitMyMilestone,
  createMyContractReview,
  updateMyPendingContract,
};
