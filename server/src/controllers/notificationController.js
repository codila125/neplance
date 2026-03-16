const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  getNotificationSummaryForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../services/notificationService");

const getMyNotifications = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const data = await listNotificationsForUser(req.user.id, limit);

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});

const getNotificationSummary = catchAsync(async (req, res) => {
  const data = await getNotificationSummaryForUser(req.user.id);

  res.status(200).json({
    status: "success",
    data,
  });
});

const markMyNotificationRead = catchAsync(async (req, res) => {
  const data = await markNotificationRead(req.params.id, req.user.id);

  if (!data) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

const markMyNotificationsRead = catchAsync(async (req, res) => {
  await markAllNotificationsRead(req.user.id);

  res.status(200).json({
    status: "success",
  });
});

module.exports = {
  getMyNotifications,
  getNotificationSummary,
  markMyNotificationRead,
  markMyNotificationsRead,
};
