const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  getJobOrThrow,
  ensureCreator,
} = require("../utils/jobAccess");
const { JOB_STATUS } = require("../constants/statuses");
const {
  validateJobUpdate,
  normalizeJobCreateDefaults,
  publishJob: publishJobService,
  deleteJob: deleteJobService,
} = require("../services/jobService");

const createJob = catchAsync(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    experienceLevel,
    budget,
    deadline,
    location,
    terms,
    status,
    jobType,
    isPublic,
    isUrgent,
    tags,
    requiredSkills,
    attachments,
    parties,
  } = req.body;

  const creatorAddress = req.user.id.toString();
  const normalizedDefaults = normalizeJobCreateDefaults({
    jobType,
    isPublic,
    isUrgent,
    tags,
    requiredSkills,
    attachments,
    parties,
    status,
  });

  const normalizedParties = [
    { address: creatorAddress, role: "CREATOR" },
    ...normalizedDefaults.parties
      .filter(
        (party) =>
          party &&
          party.address &&
          party.role &&
          party.address.toString() !== creatorAddress
      )
      .map((party) => ({
        address: party.address,
        role: party.role,
        publicKey: party.publicKey,
        signature: party.signature,
      })),
  ];

  const jobStatus = normalizedDefaults.status;

  const data = await Job.create({
    title,
    description,
    creatorAddress,
    status: jobStatus,
    jobType: normalizedDefaults.jobType,
    category,
    subcategory,
    tags: normalizedDefaults.tags,
    requiredSkills: normalizedDefaults.requiredSkills,
    experienceLevel,
    budget,
    deadline,
    isUrgent: normalizedDefaults.isUrgent,
    location,
    isPublic: normalizedDefaults.isPublic,
    parties: normalizedParties,
    terms,
    attachments: normalizedDefaults.attachments,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.status(201).json({
    status: "success",
    data,
  });
});

const findJobs = catchAsync(async (req, res) => {
  const {
    category,
    jobType,
    experienceLevel,
    minBudget,
    maxBudget,
    city,
    district,
    province,
    isRemote,
    tags,
    skills,
    search,
    isUrgent,
    isFeatured,
    sort = "-createdAt",
    page = 1,
    limit = 20,
  } = req.query;

  const query = { isPublic: true, status: JOB_STATUS.OPEN };

  if (category) query.category = category;
  if (jobType) query.jobType = jobType;
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (isUrgent === "true") query.isUrgent = true;
  if (isFeatured === "true") query.isFeatured = true;

  if (minBudget || maxBudget) {
    query["budget.min"] = {};
    if (minBudget) query["budget.min"].$gte = Number(minBudget);
    if (maxBudget) query["budget.max"] = { $lte: Number(maxBudget) };
  }

  if (city) query["location.city"] = new RegExp(city, "i");
  if (district) query["location.district"] = new RegExp(district, "i");
  if (province) query["location.province"] = province;
  if (isRemote === "true") query["location.isRemote"] = true;

  if (tags) {
    const tagArray = tags.split(",").map((t) => t.trim());
    query.tags = { $in: tagArray };
  }

  if (skills) {
    const skillArray = skills.split(",").map((s) => s.trim());
    query.requiredSkills = { $in: skillArray };
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { tags: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate("creatorAddress", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  const jobIds = data.map((job) => job._id);
  const proposalCounts = jobIds.length
    ? await Proposal.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$job", count: { $sum: 1 } } },
      ])
    : [];
  const proposalCountMap = proposalCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});
  const responseData = data.map((job) => ({
    ...job.toObject(),
    proposalCount: proposalCountMap[job._id.toString()] || 0,
  }));

  res.status(200).json({
    status: "success",
    results: data.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: responseData,
  });
});

// Admin: find jobs without public/status restriction (for admin UI)
const adminFindJobs = catchAsync(async (req, res) => {
  const {
    category,
    jobType,
    experienceLevel,
    minBudget,
    maxBudget,
    city,
    district,
    province,
    isRemote,
    tags,
    skills,
    search,
    isUrgent,
    isFeatured,
    sort = "-createdAt",
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  if (category) query.category = category;
  if (jobType) query.jobType = jobType;
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (isUrgent === "true") query.isUrgent = true;
  if (isFeatured === "true") query.isFeatured = true;

  if (minBudget || maxBudget) {
    query["budget.min"] = {};
    if (minBudget) query["budget.min"].$gte = Number(minBudget);
    if (maxBudget) query["budget.max"] = { $lte: Number(maxBudget) };
  }

  if (city) query["location.city"] = new RegExp(city, "i");
  if (district) query["location.district"] = new RegExp(district, "i");
  if (province) query["location.province"] = province;
  if (isRemote === "true") query["location.isRemote"] = true;

  if (tags) {
    const tagArray = tags.split(",").map((t) => t.trim());
    query.tags = { $in: tagArray };
  }

  if (skills) {
    const skillArray = skills.split(",").map((s) => s.trim());
    query.requiredSkills = { $in: skillArray };
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { tags: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate("creatorAddress", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  const jobIds = data.map((job) => job._id);
  const proposalCounts = jobIds.length
    ? await Proposal.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$job", count: { $sum: 1 } } },
      ])
    : [];
  const proposalCountMap = proposalCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});
  const responseData = data.map((job) => ({
    ...job.toObject(),
    proposalCount: proposalCountMap[job._id.toString()] || 0,
  }));

  res.status(200).json({
    status: "success",
    results: data.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: responseData,
  });
});

const findMyJobs = catchAsync(async (req, res) => {
  const { status, sort = "-createdAt", page = 1, limit = 20 } = req.query;

  const query = { creatorAddress: req.user.id.toString() };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate("creatorAddress", "name email")
      .populate("hiredFreelancer", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  const jobIds = data.map((job) => job._id);
  const proposalCounts = jobIds.length
    ? await Proposal.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$job", count: { $sum: 1 } } },
      ])
    : [];
  const proposalCountMap = proposalCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});
  const responseData = data.map((job) => ({
    ...job.toObject(),
    proposalCount: proposalCountMap[job._id.toString()] || 0,
  }));

  res.status(200).json({
    status: "success",
    results: data.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: responseData,
  });
});

const getJob = catchAsync(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("creatorAddress", "name email")
    .populate("hiredFreelancer", "name email");

  if (!job) throw new AppError("Job not found", 404);

  const currentUserId = req.user?.id;
  const creatorId = job.creatorAddress?._id || job.creatorAddress;
  const isCreator =
    currentUserId &&
    creatorId &&
    creatorId.toString() === currentUserId.toString();
  const isParty = currentUserId
    ? (job.parties || []).some(
        (party) =>
          party.address && party.address.toString() === currentUserId.toString()
      )
    : false;

  if (!job.isPublic && !isCreator && !isParty) {
    throw new AppError("You are not authorized to view this job", 403);
  }

  if (job.isPublic) {
    job.viewCount += 1;
    await job.save();
  }

  const proposalCount = await Proposal.countDocuments({ job: job._id });

  res.status(200).json({
    status: "success",
    data: { ...job.toObject(), proposalCount },
  });
});

const updateJob = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const job = await getJobOrThrow(jobId);
  ensureCreator(job, req.user.id, "You can only update your own jobs");
  validateJobUpdate(job);

  const allowedUpdates = [
    "title",
    "description",
    "jobType",
    "category",
    "subcategory",
    "tags",
    "requiredSkills",
    "experienceLevel",
    "budget",
    "deadline",
    "isUrgent",
    "location",
    "isPublic",
    "terms",
    "attachments",
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  updates.updatedAt = new Date();

  const updatedJob = await Job.findByIdAndUpdate(jobId, updates, {
    new: true,
    runValidators: true,
  }).populate("creatorAddress", "name email");

  res.status(200).json({
    status: "success",
    data: updatedJob,
  });
});

const publishJob = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const job = await getJobOrThrow(jobId);
  ensureCreator(job, req.user.id, "You can only publish your own jobs");

  await publishJobService(job);

  res.status(200).json({
    status: "success",
    message: "Job published successfully",
    data: job,
  });
});

const deleteJob = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const job = await getJobOrThrow(jobId);
  ensureCreator(job, req.user.id, "You can only delete your own jobs");

  await deleteJobService(job, Job.findByIdAndDelete.bind(Job));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getJobCategories = catchAsync(async (req, res) => {
  const categories = await Job.distinct("category");
  res.status(200).json({
    status: "success",
    data: categories,
  });
});

module.exports = {
  createJob,
  findJobs,
  findMyJobs,
  getJob,
  updateJob,
  publishJob,
  deleteJob,
  getJobCategories,
  adminFindJobs,
};
