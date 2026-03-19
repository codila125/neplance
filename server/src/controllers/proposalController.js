const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  getJobOrThrow,
  ensureCreator,
  isPartyUser,
} = require("../utils/jobAccess");
const { PROPOSAL_STATUS } = require("../constants/statuses");
const {
  createProposal: createProposalService,
  rejectProposal: rejectProposalService,
  withdrawProposal: withdrawProposalService,
} = require("../services/proposalService");
const { createNotification } = require("../services/notificationService");

const attachReviewSummaryToFreelancer = async (proposalDoc) => {
  if (!proposalDoc?.freelancer?._id) {
    return proposalDoc;
  }

  const summaryRows = await Review.aggregate([
    { $match: { reviewee: proposalDoc.freelancer._id } },
    {
      $group: {
        _id: "$reviewee",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const summary = summaryRows[0]
    ? {
        averageRating: Number(summaryRows[0].averageRating || 0).toFixed(1),
        totalReviews: Number(summaryRows[0].totalReviews || 0),
      }
    : {
        averageRating: "0.0",
        totalReviews: 0,
      };

  return {
    ...proposalDoc.toObject(),
    freelancer: {
      ...proposalDoc.freelancer.toObject(),
      reviewSummary: summary,
    },
  };
};

const attachReviewSummariesToFreelancers = async (proposalDocs) => {
  if (!Array.isArray(proposalDocs) || proposalDocs.length === 0) {
    return [];
  }

  const freelancerIds = proposalDocs
    .map((proposal) => proposal.freelancer?._id)
    .filter(Boolean);
  const rows = freelancerIds.length
    ? await Review.aggregate([
        { $match: { reviewee: { $in: freelancerIds } } },
        {
          $group: {
            _id: "$reviewee",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ])
    : [];
  const summaryMap = rows.reduce((acc, row) => {
    acc[String(row._id)] = {
      averageRating: Number(row.averageRating || 0).toFixed(1),
      totalReviews: Number(row.totalReviews || 0),
    };
    return acc;
  }, {});

  return proposalDocs.map((proposal) => ({
    ...proposal.toObject(),
    freelancer: proposal.freelancer
      ? {
          ...proposal.freelancer.toObject(),
          reviewSummary:
            summaryMap[String(proposal.freelancer._id)] || {
              averageRating: "0.0",
              totalReviews: 0,
            },
        }
      : proposal.freelancer,
  }));
};

const attachClientSummariesToProposalJobs = async (proposalDocs) => {
  if (!Array.isArray(proposalDocs) || proposalDocs.length === 0) {
    return [];
  }

  const creatorIds = proposalDocs
    .map((proposal) => proposal.job?.creatorAddress?._id)
    .filter(Boolean);
  const rows = creatorIds.length
    ? await Review.aggregate([
        { $match: { reviewee: { $in: creatorIds } } },
        {
          $group: {
            _id: "$reviewee",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ])
    : [];
  const summaryMap = rows.reduce((acc, row) => {
    acc[String(row._id)] = {
      averageRating: Number(row.averageRating || 0).toFixed(1),
      totalReviews: Number(row.totalReviews || 0),
    };
    return acc;
  }, {});

  return proposalDocs.map((proposal) => ({
    ...proposal.toObject(),
    job: proposal.job
      ? {
          ...proposal.job.toObject(),
          creatorAddress: proposal.job.creatorAddress
            ? {
                ...proposal.job.creatorAddress.toObject(),
                reviewSummary:
                  summaryMap[String(proposal.job.creatorAddress._id)] || {
                    averageRating: "0.0",
                    totalReviews: 0,
                  },
              }
            : proposal.job.creatorAddress,
        }
      : proposal.job,
  }));
};

const getMyProposals = catchAsync(async (req, res) => {
  const proposals = await Proposal.find({ freelancer: req.user.id }).populate({
    path: "job",
    populate: {
      path: "creatorAddress",
      select: "name email avatar verificationStatus",
    },
  });
  const data = await attachClientSummariesToProposalJobs(proposals);

  res.status(200).json({
    status: "success",
    data,
  });
});

const createProposal = catchAsync(async (req, res) => {
  const {
    job: jobId,
    amount,
    coverLetter,
    deliveryDays,
    revisionsIncluded,
    attachments,
    status,
  } = req.body;
  if (status !== undefined) {
    throw new AppError("Status cannot be set on proposal creation", 400);
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.creatorAddress.toString() === req.user.id.toString()) {
    throw new AppError("You cannot submit a proposal on your own job", 400);
  }

  await createProposalService(job);

  const existingProposal = await Proposal.findOne({
    freelancer: req.user.id,
    job: jobId,
    status: { $nin: [PROPOSAL_STATUS.WITHDRAWN, PROPOSAL_STATUS.REJECTED] },
  });

  if (existingProposal) {
    throw new AppError(
      "You have already submitted a proposal for this job",
      400
    );
  }

  const data = await Proposal.create({
    freelancer: req.user.id,
    job: jobId,
    status: PROPOSAL_STATUS.PENDING,
    amount,
    coverLetter,
    deliveryDays,
    revisionsIncluded,
    attachments,
  });

  await createNotification({
    recipient: job.creatorAddress,
    actor: req.user.id,
    type: "proposal.submitted",
    title: "New proposal received",
    message: `${req.user.name || "A freelancer"} submitted a proposal for "${
      job.title
    }".`,
    link: `/proposals/${data._id}`,
    metadata: {
      job: job._id,
      proposal: data._id,
    },
  });

  res.status(201).json({
    status: "success",
    data,
  });
});

const getProposalForJob = catchAsync(async (req, res) => {
  //make sure the respective client is seraching for the job

  const jobId = req.params.jobId;

  const job = await getJobOrThrow(jobId, "Job not found");
  ensureCreator(
    job,
    req.user.id,
    "You are not authorized to do this. Only creator of Job can get a proposal"
  );

  const proposals = await Proposal.find({ job: jobId }).populate(
    "freelancer",
    "name email avatar bio experienceLevel availabilityStatus skills verificationStatus"
  );
  const data = await attachReviewSummariesToFreelancers(proposals);

  res.status(200).json({
    status: "success",
    data,
  });
});

const rejectProposal = catchAsync(async (req, res, next) => {
  const proposalId = req.params.id;
  const { reason } = req.body;

  const proposal = await Proposal.findById(proposalId).populate("job");
  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  const job = proposal.job;
  if (!job) throw new AppError("Job not found", 404);

  ensureCreator(job, req.user.id, "You can't reject proposals for this job");
  const updatedProposal = await rejectProposalService(proposal, job, reason);

  await createNotification({
    recipient: updatedProposal.freelancer,
    actor: req.user.id,
    type: "proposal.rejected",
    title: "Proposal rejected",
    message: `Your proposal for "${job.title}" was rejected.`,
    link: `/proposals/${updatedProposal._id}`,
    metadata: {
      job: job._id,
      proposal: updatedProposal._id,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Proposal rejected",
    data: updatedProposal,
  });
});

const getProposalById = catchAsync(async (req, res, next) => {
  const proposalId = req.params.id;
  const userId = String(req.user.id);

  const proposal = await Proposal.findById(proposalId);

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  const isFreelancer = String(proposal.freelancer) === userId;

  if (isFreelancer) {
    const populatedProposal = await Proposal.findById(proposalId)
      .populate(
        "freelancer",
        "name email avatar bio experienceLevel availabilityStatus skills verificationStatus"
      )
      .populate({
        path: "job",
        populate: {
          path: "creatorAddress",
          select: "name email avatar verificationStatus",
        },
      });
    return res
      .status(200)
      .json({ status: "success", data: await attachReviewSummaryToFreelancer(populatedProposal) });
  }

  const job = await Job.findById(proposal.job);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  const isJobOwner =
    String(job.creatorAddress) === userId ||
    isPartyUser(job, userId, "CREATOR");

  if (!isJobOwner) {
    return next(
      new AppError("You are not authorized to view this proposal", 403)
    );
  }

  const populatedProposal = await Proposal.findById(proposalId)
    .populate(
      "freelancer",
      "name email avatar bio experienceLevel availabilityStatus skills verificationStatus"
    )
    .populate({
      path: "job",
      populate: {
        path: "creatorAddress",
        select: "name email avatar verificationStatus",
      },
    });
  res
    .status(200)
    .json({ status: "success", data: await attachReviewSummaryToFreelancer(populatedProposal) });
});

const withdrawProposal = catchAsync(async (req, res, next) => {
  const proposalId = req.params.id;

  const proposal = await Proposal.findById(proposalId);

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  if (proposal.freelancer.toString() !== req.user.id.toString()) {
    return next(new AppError("You can only withdraw your own proposals", 403));
  }

  const updatedProposal = await withdrawProposalService(proposal);

  res.status(200).json({
    status: "success",
    message: "Proposal withdrawn successfully",
    data: updatedProposal,
  });
});

module.exports = {
  createProposal,
  getProposalForJob,
  rejectProposal,
  getMyProposals,
  getProposalById,
  withdrawProposal,
};
