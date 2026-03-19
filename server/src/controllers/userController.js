const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/User");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const { pickUserFields } = require("../utils/userFields");
const { JOB_STATUS, PROPOSAL_STATUS } = require("../constants/statuses");
const { getReviewSummaryForUser } = require("../services/reviewService");

const attachReviewSummaryToUser = async (user) => {
  if (!user) {
    return null;
  }

  const reviewSummary = await getReviewSummaryForUser(user._id);

  return {
    ...user.toObject(),
    reviewSummary,
  };
};

const attachReviewSummariesToUsers = async (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    return [];
  }

  const userIds = users.map((user) => user._id);
  const summaryRows = await Review.aggregate([
    { $match: { reviewee: { $in: userIds } } },
    {
      $group: {
        _id: "$reviewee",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const summaryMap = summaryRows.reduce((acc, row) => {
    acc[String(row._id)] = {
      averageRating: Number(row.averageRating || 0).toFixed(1),
      totalReviews: Number(row.totalReviews || 0),
    };
    return acc;
  }, {});

  return users.map((user) => ({
    ...user.toObject(),
    reviewSummary: summaryMap[String(user._id)] || {
      averageRating: "0.0",
      totalReviews: 0,
    },
  }));
};

const getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const enrichedUser = await attachReviewSummaryToUser(user);

  res.status(200).json({
    status: "success",
    data: {
      user: enrichedUser,
    },
  });
});

const updateMyProfile = catchAsync(async (req, res, next) => {
  const updates = pickUserFields(req.body, req.user.role);

  if (updates.verificationDocuments !== undefined) {
    const hasDocuments =
      Array.isArray(updates.verificationDocuments) &&
      updates.verificationDocuments.length > 0;

    updates.verificationStatus = hasDocuments ? "pending" : "not_submitted";
    updates.verificationReviewedAt = undefined;
    updates.verificationReviewedBy = undefined;
    updates.verificationRejectionReason = undefined;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

const checkDeleteEligibility = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const [activeJob, activeProposal, openJob] = await Promise.all([
    Job.findOne({
      $or: [
        { creatorAddress: userId, status: JOB_STATUS.IN_PROGRESS },
        { hiredFreelancer: userId, status: JOB_STATUS.IN_PROGRESS },
      ],
    }).select("title status"),
    Proposal.findOne({
      freelancer: userId,
      status: { $in: [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED] },
    }).populate("job", "title"),
    Job.findOne({ creatorAddress: userId, status: JOB_STATUS.OPEN }).select(
      "title status"
    ),
  ]);

  const reasons = [];
  if (activeJob) {
    reasons.push({
      type: "active_job",
      message: `You have an active job: "${activeJob.title}"`,
    });
  }
  if (activeProposal) {
    reasons.push({
      type: "active_proposal",
      message: `You have an active proposal for: "${activeProposal.job?.title || "a job"}"`,
    });
  }
  if (openJob) {
    reasons.push({
      type: "open_job",
      message: `You have an open job: "${openJob.title}"`,
    });
  }

  res.status(200).json({
    status: "success",
    canDelete: reasons.length === 0,
    reasons,
  });
});

const deactivateMyAccount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const [activeJob, activeProposal, openJob] = await Promise.all([
    Job.findOne({
      $or: [
        { creatorAddress: userId, status: JOB_STATUS.IN_PROGRESS },
        { hiredFreelancer: userId, status: JOB_STATUS.IN_PROGRESS },
      ],
    }),
    Proposal.findOne({
      freelancer: userId,
      status: { $in: [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED] },
    }),
    Job.findOne({ creatorAddress: userId, status: JOB_STATUS.OPEN }),
  ]);

  if (activeJob) {
    throw new AppError("Cannot delete account while active in a job", 400);
  }

  if (activeProposal) {
    throw new AppError("Cannot delete account with active proposals", 400);
  }

  if (openJob) {
    throw new AppError("Cannot delete account with open jobs", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await user.deactivate();

  res.status(200).json({
    status: "success",
    message: "Account deactivated successfully",
  });
});

const getFreelancers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, skills, search, availabilityStatus } = req.query;

  const query = { role: "freelancer" };
  if (skills) query.skills = { $in: skills.split(",").map(s => s.trim()) };
  if (search) query.$or = [
    { name: new RegExp(search, "i") },
    { bio: new RegExp(search, "i") }
  ];
  if (availabilityStatus) query.availabilityStatus = availabilityStatus;

  const skip = (Number(page) - 1) * Number(limit);
  const selectFields =
    "name email avatar bio location skills hourlyRate experienceLevel jobTypePreference availabilityStatus languages portfolio verificationStatus verificationReviewedAt verificationRejectionReason";

  const [freelancers, total] = await Promise.all([
    User.find(query).select(selectFields).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  const enrichedFreelancers = await attachReviewSummariesToUsers(freelancers);

  res.status(200).json({
    status: "success",
    results: enrichedFreelancers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: enrichedFreelancers,
  });
});

const getUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50, search, role } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: new RegExp(search, "i") },
    { email: new RegExp(search, "i") },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const selectFields =
    "name email avatar role bio location verificationStatus verificationReviewedAt verificationRejectionReason";

  const [users, total] = await Promise.all([
    User.find(query).select(selectFields).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: users,
  });
});

const getFreelancerById = catchAsync(async (req, res, next) => {
  const freelancer = await User.findOne({ _id: req.params.id, role: "freelancer" });

  if (!freelancer) {
    return res.status(404).json({
      status: "fail",
      message: "Freelancer not found",
    });
  }

  const enrichedFreelancer = await attachReviewSummaryToUser(freelancer);

  res.status(200).json({
    status: "success",
    data: enrichedFreelancer,
  });
});

const listSavedJobs = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: "savedJobs",
    populate: {
      path: "creatorAddress",
      select: "name email avatar verificationStatus",
    },
  });

  res.status(200).json({
    status: "success",
    data: user?.savedJobs || [],
  });
});

const toggleSavedJob = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const jobId = String(req.params.jobId);
  const currentSavedJobs = Array.isArray(user.savedJobs)
    ? user.savedJobs.map((value) => String(value))
    : [];
  const isSaved = currentSavedJobs.includes(jobId);

  user.savedJobs = isSaved
    ? currentSavedJobs.filter((value) => value !== jobId)
    : [...currentSavedJobs, jobId];
  user.updatedAt = new Date();

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      saved: !isSaved,
      savedJobs: user.savedJobs,
    },
  });
});

const listVerificationQueue = catchAsync(async (req, res, next) => {
  const status = req.query.status || "pending";
  const query =
    status === "all"
      ? {
          verificationStatus: {
            $in: ["pending", "verified", "rejected"],
          },
        }
      : { verificationStatus: status };

  const users = await User.find(query)
    .select(
      "name email avatar role bio verificationDocuments verificationStatus verificationReviewedAt verificationReviewedBy verificationRejectionReason"
    )
    .sort({ updatedAt: -1 });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

const reviewUserVerification = catchAsync(async (req, res, next) => {
  const { decision, reason } = req.body;

  if (!["approve", "reject"].includes(decision)) {
    throw new AppError("Decision must be approve or reject", 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!Array.isArray(user.verificationDocuments) || user.verificationDocuments.length === 0) {
    throw new AppError("This user has no verification documents", 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      verificationStatus: decision === "approve" ? "verified" : "rejected",
      verificationReviewedAt: new Date(),
      verificationReviewedBy: req.user.id,
      verificationRejectionReason:
        decision === "reject" ? String(reason || "").trim() : undefined,
      updatedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  deactivateMyAccount,
  checkDeleteEligibility,
  getFreelancers,
  getUsers,
  getFreelancerById,
  listVerificationQueue,
  reviewUserVerification,
  listSavedJobs,
  toggleSavedJob,
};
