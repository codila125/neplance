const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/User");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const { pickUserFields } = require("../utils/userFields");
const { JOB_STATUS, PROPOSAL_STATUS } = require("../constants/statuses");

const getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const updateMyProfile = catchAsync(async (req, res, next) => {
  const updates = pickUserFields(req.body, req.user.role);

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
  const selectFields = "name email avatar bio location skills hourlyRate experienceLevel jobTypePreference availabilityStatus languages portfolio";

  const [freelancers, total] = await Promise.all([
    User.find(query).select(selectFields).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: freelancers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: freelancers,
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
  const selectFields = "name email avatar role bio location";

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

  res.status(200).json({
    status: "success",
    data: freelancer,
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
};
