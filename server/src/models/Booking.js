const mongoose = require("mongoose");
const { BOOKING_STATUS } = require("../constants/statuses");

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    publicId: String,
    resourceType: String,
    uploadedAt: Date,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema({
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
    unique: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  freelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
  },
  requiresVisit: {
    type: Boolean,
    default: false,
  },
  scheduledFor: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: 3000,
  },
  visitVerification: {
    status: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "VERIFIED"],
      default: "NOT_REQUIRED",
    },
    otpCode: String,
    generatedAt: Date,
    verifiedAt: Date,
    generatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    verifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  quoteAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  quoteNotes: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  quoteAttachments: {
    type: [attachmentSchema],
    default: [],
  },
  quotedAt: Date,
  contract: {
    type: mongoose.Schema.ObjectId,
    ref: "Contract",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ client: 1, status: 1, createdAt: -1 });
bookingSchema.index({ freelancer: 1, status: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
