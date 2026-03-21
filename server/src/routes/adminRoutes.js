const express = require("express");

const router = express.Router();

const { adminFindJobs } = require("../controllers/jobController");
const { getAdminContractById } = require("../controllers/contractController");
const {
  getFinanceManagement,
  listPaymentVerificationQueue,
  reviewPaymentVerification,
  reviewWithdrawalRelease,
} = require("../controllers/walletController");
const {
  listVerificationQueue,
  reviewUserVerification,
} = require("../controllers/userController");
const {
  listDisputesQueue,
  reviewDispute,
} = require("../controllers/disputeController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

router.use(protect, restrictTo("admin"));

router.get("/jobs", adminFindJobs);
router.get("/verification", listVerificationQueue);
router.patch("/verification/:id", reviewUserVerification);
router.get("/disputes", listDisputesQueue);
router.patch("/disputes/:id", reviewDispute);
router.get("/contracts/:id", getAdminContractById);
router.get("/finance", getFinanceManagement);
router.get("/payment-verification", listPaymentVerificationQueue);
router.patch("/payment-verification/:id", reviewPaymentVerification);
router.patch("/withdrawals/:id", reviewWithdrawalRelease);

module.exports = router;
