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
const { protect, restrictTo } = require("../middlewares/authMiddleware");

router.use(protect);

router.get("/categories", getJobCategories);
router.get("/myJobs", restrictTo("client"), findMyJobs);

router
  .route("/")
  .get(restrictTo("freelancer"), findJobs)
  .post(restrictTo("client"), createJob);

router
  .route("/:id")
  .get(getJob)
  .patch(restrictTo("client"), updateJob)
  .delete(restrictTo("client"), deleteJob);

router.patch("/:id/publish", restrictTo("client"), publishJob);

module.exports = router;
