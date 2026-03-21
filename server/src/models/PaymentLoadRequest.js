const mongoose = require("mongoose");

const paymentLoadRequestSchema = new mongoose.Schema({
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
  approvedAmount: {
    type: Number,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ["esewa", "khalti", "bank"],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  screenshot: {
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
    enum: ["pending", "approved", "partial", "rejected"],
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

paymentLoadRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentLoadRequest", paymentLoadRequestSchema);
