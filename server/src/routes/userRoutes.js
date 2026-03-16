const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
  deactivateMyAccount,
  checkDeleteEligibility,
  getFreelancers,
  getUsers,
  getFreelancerById,
} = require("../controllers/userController");

router.get("/freelancers", getFreelancers);
router.get("/freelancers/:id", getFreelancerById);
router.get("/", getUsers);
router.route("/me").get(protect, getMyProfile).patch(protect, updateMyProfile).delete(protect, deactivateMyAccount);
router.get("/me/check-delete-eligibility", protect, checkDeleteEligibility);

module.exports = router;
