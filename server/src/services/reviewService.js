const Review = require("../models/Review");
const AppError = require("../utils/appError");
const { CONTRACT_STATUS } = require("../constants/statuses");

const REVIEW_ROLES = {
  CLIENT: "CLIENT",
  FREELANCER: "FREELANCER",
};

async function createContractReview({ contract, reviewerId, rating, comment }) {
  if (contract.status !== CONTRACT_STATUS.COMPLETED) {
    throw new AppError("Reviews can only be submitted after completion", 400);
  }

  const isClient = String(contract.client) === String(reviewerId);
  const isFreelancer = String(contract.freelancer) === String(reviewerId);

  if (!isClient && !isFreelancer) {
    throw new AppError("Only contract participants can leave a review", 403);
  }

  const reviewerRole = isClient ? REVIEW_ROLES.CLIENT : REVIEW_ROLES.FREELANCER;
  const revieweeRole = isClient
    ? REVIEW_ROLES.FREELANCER
    : REVIEW_ROLES.CLIENT;
  const reviewee = isClient ? contract.freelancer : contract.client;

  const existingReview = await Review.findOne({
    contract: contract._id,
    reviewer: reviewerId,
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this contract", 400);
  }

  return Review.create({
    contract: contract._id,
    job: contract.job,
    proposal: contract.proposal,
    reviewer: reviewerId,
    reviewee,
    reviewerRole,
    revieweeRole,
    rating: Number(rating),
    comment: typeof comment === "string" ? comment.trim() : "",
    updatedAt: new Date(),
  });
}

async function listContractReviews(contractId) {
  return Review.find({ contract: contractId })
    .populate("reviewer", "name email avatar")
    .populate("reviewee", "name email avatar")
    .sort({ createdAt: -1 });
}

async function getReviewSummaryForUser(userId) {
  const [summaryResult, recentReviews] = await Promise.all([
    Review.aggregate([
      { $match: { reviewee: userId } },
      {
        $group: {
          _id: "$reviewee",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
    Review.find({ reviewee: userId })
      .populate("reviewer", "name email avatar")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const summary = summaryResult[0] || {
    averageRating: 0,
    totalReviews: 0,
  };

  return {
    averageRating: Number(summary.averageRating || 0).toFixed(1),
    totalReviews: Number(summary.totalReviews || 0),
    recentReviews,
  };
}

module.exports = {
  createContractReview,
  getReviewSummaryForUser,
  listContractReviews,
};
