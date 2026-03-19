const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
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
    index: true,
  },
  reviewer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  reviewee: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  reviewerRole: {
    type: String,
    enum: ["CLIENT", "FREELANCER"],
    required: true,
  },
  revieweeRole: {
    type: String,
    enum: ["CLIENT", "FREELANCER"],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: "",
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

reviewSchema.index({ contract: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
