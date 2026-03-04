const express = require("express");
const router = express.Router();

const {
  login,
  register,
  logout,
  getMe,
  getUser,
  refreshAccessToken,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { loginLimiter, refreshLimiter, authLimiter } = require("../middlewares/rateLimiter");

router.route("/login").post(loginLimiter, login);
router.route("/logout").get(authLimiter, logout);
router.route("/register").post(authLimiter, register);
router.route("/refresh").get(refreshLimiter, refreshAccessToken);
router.route("/me").get(protect, getUser);

module.exports = router;
