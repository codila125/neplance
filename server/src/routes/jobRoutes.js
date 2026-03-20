const express = require("express");

const router = express.Router();

const {
  createJob,
  findJobs,
  findMyJobs,
  getJob,
  updateJob,
  publishJob,
  deleteJob,
  getJobCategories,
} = require("../controllers/jobController");
const {
  protect,
  requireVerifiedUser,
  restrictTo,
} = require("../middlewares/authMiddleware");

router.use(protect);

router.get("/categories", getJobCategories);
router.get("/myJobs", restrictTo("client"), findMyJobs);

router
  .route("/")
  .get(restrictTo("freelancer"), findJobs)
  .post(restrictTo("client"), requireVerifiedUser, createJob);

router
  .route("/:id")
  .get(getJob)
  .patch(restrictTo("client"), updateJob)
  .delete(restrictTo("client"), deleteJob);

router.patch("/:id/publish", restrictTo("client"), requireVerifiedUser, publishJob);

module.exports = router;
