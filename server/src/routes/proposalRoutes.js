const express = require("express");
const {
  createProposal,
  getProposalForJob,
  rejectProposal,
  getMyProposals,
  getProposalById,
  updateProposal,
  withdrawProposal,
} = require("../controllers/proposalController");
const {
  protect,
  requireVerifiedUser,
  restrictTo,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

//restrict to freelancers only
router.route("/").post(restrictTo("freelancer"), requireVerifiedUser, createProposal);

//find my  proposals
router.route("/myProposals").get(restrictTo("freelancer"), getMyProposals);

//find proposal for a job
//restrict to the respective JobId owner/Client
router.route("/job/:jobId").get(restrictTo("client"), getProposalForJob);

router.route("/:id/reject").patch(restrictTo("client"), rejectProposal);

router
  .route("/:id")
  .get(getProposalById)
  .patch(restrictTo("freelancer"), updateProposal);

router.route("/:id/withdraw").patch(restrictTo("freelancer"), withdrawProposal);

module.exports = router;
