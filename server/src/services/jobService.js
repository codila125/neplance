const AppError = require("../utils/appError");
const Proposal = require("../models/Proposal");
const { JOB_STATUS } = require("../constants/statuses");
const {
  normalizeJobCreateStatus,
  assertJobCanUpdate,
  assertJobCanPublish,
  assertJobCanDelete,
} = require("./statusTransitions");

const getCreateStatus = (status) => normalizeJobCreateStatus(status);

const normalizeJobCreateDefaults = ({
  jobType,
  isPublic,
  isUrgent,
  tags,
  requiredSkills,
  attachments,
  parties,
  status,
}) => {
  return {
    jobType: jobType || "digital",
    isPublic: isPublic !== undefined ? isPublic : true,
    isUrgent: isUrgent !== undefined ? isUrgent : false,
    tags: Array.isArray(tags) ? tags : [],
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    parties: Array.isArray(parties) ? parties : [],
    status: normalizeJobCreateStatus(status),
  };
};

const validateJobUpdate = (job) => {
  assertJobCanUpdate(job);
};

const publishJob = async (job) => {
  assertJobCanPublish(job);

  if (
    !job.category ||
    (job.budgetType !== "inspection_required" && !job.budget?.min)
  ) {
    throw new AppError(
      "Job must have category and budget to be published",
      400
    );
  }

  job.status = JOB_STATUS.OPEN;
  job.updatedAt = new Date();
  await job.save();
  return job;
};

const deleteJob = async (job, deleteFn) => {
  assertJobCanDelete(job);
  await Proposal.deleteMany({ job: job._id });
  await deleteFn(job._id);
};

module.exports = {
  getCreateStatus,
  normalizeJobCreateDefaults,
  validateJobUpdate,
  publishJob,
  deleteJob,
};
