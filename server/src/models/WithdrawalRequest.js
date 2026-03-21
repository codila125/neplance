const mongoose = require("mongoose");

const contractSnapshotSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.ObjectId,
      ref: "Contract",
    },
    title: String,
    amount: Number,
    clientName: String,
    freelancerName: String,
    completedAt: Date,
  },
  { _id: false },
);

const withdrawalRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: "Wallet",
    required: true,
    index: true,
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 1,
  },
  qrAttachment: {
    name: String,
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: String,
    resourceType: String,
    uploadedAt: Date,
  },
  status: {
    type: String,
    enum: ["pending", "released", "rejected"],
    default: "pending",
    index: true,
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  contractSnapshots: {
    type: [contractSnapshotSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
