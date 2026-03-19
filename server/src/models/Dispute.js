const mongoose = require("mongoose");
const { DISPUTE_STATUS } = require("../constants/statuses");

const disputeEvidenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      trim: true,
      default: "raw",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.ObjectId,
    ref: "Contract",
    required: true,
    index: true,
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
    index: true,
  },
  proposal: {
    type: mongoose.Schema.ObjectId,
    ref: "Proposal",
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  freelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  openedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 4000,
  },
  evidenceAttachments: {
    type: [disputeEvidenceSchema],
    default: [],
  },
  status: {
    type: String,
    enum: Object.values(DISPUTE_STATUS),
    default: DISPUTE_STATUS.OPEN,
    index: true,
  },
  resolutionAction: {
    type: String,
    enum: ["refund_client", "release_freelancer", "reject"],
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: 4000,
  },
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

disputeSchema.index({ contract: 1, status: 1, createdAt: -1 });

const Dispute = mongoose.model("Dispute", disputeSchema);

module.exports = Dispute;
