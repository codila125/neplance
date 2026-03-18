const express = require("express");
const {
  approveMyMilestone,
  completeMyContract,
  createContract,
  getContractById,
  getContractByProposal,
  listMyContracts,
  requestMyContractCancellation,
  respondMyContractCancellation,
  signMyContract,
  submitContractWork,
  submitMyMilestone,
} = require("../controllers/contractController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listMyContracts);
router.get("/proposal/:proposalId", getContractByProposal);
router.post("/proposal/:proposalId", createContract);
router.patch("/:id/milestones/:index/submit", submitMyMilestone);
router.patch("/:id/milestones/:index/approve", approveMyMilestone);
router.patch("/:id/submit", submitContractWork);
router.patch("/:id/complete", completeMyContract);
router.patch("/:id/cancel", requestMyContractCancellation);
router.patch("/:id/cancel/respond", respondMyContractCancellation);
router.get("/:id", getContractById);
router.patch("/:id/sign", signMyContract);

module.exports = router;
