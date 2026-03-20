const express = require("express");

const router = express.Router();

const { adminFindJobs } = require("../controllers/jobController");
const { getAdminContractById } = require("../controllers/contractController");
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

module.exports = router;
