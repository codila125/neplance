const express = require("express");
const router = express.Router();

const { protect, restrictTo } = require("../middlewares/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
  deactivateMyAccount,
  checkDeleteEligibility,
  getFreelancers,
  getUsers,
  getFreelancerById,
  listSavedJobs,
  toggleSavedJob,
} = require("../controllers/userController");

router.get("/freelancers", getFreelancers);
router.get("/freelancers/:id", getFreelancerById);
router.get("/", protect, restrictTo("admin"), getUsers);
router.route("/me").get(protect, getMyProfile).patch(protect, updateMyProfile).delete(protect, deactivateMyAccount);
router.get("/me/check-delete-eligibility", protect, checkDeleteEligibility);
router.get("/me/saved-jobs", protect, restrictTo("freelancer"), listSavedJobs);
router.patch("/me/saved-jobs/:jobId", protect, restrictTo("freelancer"), toggleSavedJob);

module.exports = router;
