const express = require("express");
const {
  approveMyMilestone,
  completeMyContract,
  createMyContractReview,
  createMyContractDispute,
  createContract,
  getContractById,
  getContractByProposal,
  listMyContracts,
  requestContractWorkChanges,
  requestMyContractCancellation,
  requestMilestoneChanges,
  respondMyContractCancellation,
  signMyContract,
  submitContractWork,
  submitMyMilestone,
} = require("../controllers/contractController");
const { protect, requireVerifiedUser } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listMyContracts);
router.get("/proposal/:proposalId", getContractByProposal);
router.post("/proposal/:proposalId", requireVerifiedUser, createContract);
router.patch("/:id/milestones/:index/submit", submitMyMilestone);
router.patch("/:id/milestones/:index/approve", approveMyMilestone);
router.patch("/:id/milestones/:index/request-changes", requestMilestoneChanges);
router.patch("/:id/submit", submitContractWork);
router.patch("/:id/submit/request-changes", requestContractWorkChanges);
router.patch("/:id/complete", completeMyContract);
router.patch("/:id/cancel", requestMyContractCancellation);
router.patch("/:id/cancel/respond", respondMyContractCancellation);
router.post("/:id/reviews", createMyContractReview);
router.post("/:id/disputes", createMyContractDispute);
router.get("/:id", getContractById);
router.patch("/:id/sign", requireVerifiedUser, signMyContract);

module.exports = router;
