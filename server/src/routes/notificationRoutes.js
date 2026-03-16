const express = require("express");
const {
  getMyNotifications,
  getNotificationSummary,
  markMyNotificationRead,
  markMyNotificationsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.get("/summary", getNotificationSummary);
router.patch("/read-all", markMyNotificationsRead);
router.patch("/:id/read", markMyNotificationRead);

module.exports = router;
