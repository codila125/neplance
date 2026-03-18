const mongoose = require("mongoose");
const { JOB_STATUS } = require("../constants/statuses");

const partySchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["CONTRACTOR", "ARBITRATOR", "CREATOR"],
      required: true,
    },
    publicKey: mongoose.Schema.Types.Buffer,
    signature: mongoose.Schema.Types.Buffer,
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    district: String,
    province: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isRemote: { type: Boolean, default: false },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: "NPR" },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 5000,
  },
  jobType: {
    type: String,
    enum: ["digital", "physical"],
    required: true,
    default: "digital",
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subcategory: {
    type: String,
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  requiredSkills: [
    {
      type: String,
      trim: true,
    },
  ],
  experienceLevel: {
    type: String,
    enum: ["entry", "intermediate", "expert"],
  },
  budget: budgetSchema,
  deadline: Date,
  isUrgent: {
    type: Boolean,
    default: false,
  },
  location: locationSchema,
  isPublic: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.DRAFT,
  },
  parties: [partySchema],
  terms: String,
  creatorAddress: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  attachments: [String],
  selectedProposal: {
    type: mongoose.Schema.ObjectId,
    ref: "Proposal",
  },
  activeContract: {
    type: mongoose.Schema.ObjectId,
    ref: "Contract",
  },
  hiredFreelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ "location.city": 1, "location.district": 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ deadline: 1 });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
