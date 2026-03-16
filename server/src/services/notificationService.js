const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  const rawValue = value._id || value.id || value;

  if (!mongoose.Types.ObjectId.isValid(rawValue)) {
    return null;
  }

  return new mongoose.Types.ObjectId(rawValue);
};

const createNotification = async ({
  recipient,
  actor,
  type,
  title,
  message,
  link,
  metadata,
}) => {
  const recipientId = normalizeObjectId(recipient);
  const actorId = normalizeObjectId(actor);

  if (!recipientId) {
    return null;
  }

  if (actorId && recipientId.toString() === actorId.toString()) {
    return null;
  }

  return Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    title,
    message,
    link,
    metadata,
  });
};

const listNotificationsForUser = async (userId, limit = 20) =>
  Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email");

const getNotificationSummaryForUser = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return { unreadCount };
};

const markNotificationRead = async (notificationId, userId) =>
  Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      new: true,
    }
  );

const markAllNotificationsRead = async (userId) =>
  Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

module.exports = {
  createNotification,
  getNotificationSummaryForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
};
