const AppError = require("../utils/appError");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const normalizeMessageAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .filter((attachment) => attachment?.url)
    .map((attachment) => ({
      name: attachment.name?.trim() || "",
      url: String(attachment.url).trim(),
      publicId: attachment.publicId?.trim() || "",
      resourceType: attachment.resourceType?.trim() || "raw",
      uploadedAt: attachment.uploadedAt || new Date(),
    }));
};

const getParticipantRole = (conversation, userId) => {
  const normalizedUserId = userId.toString();
  const clientId = conversation.client?._id || conversation.client;
  const freelancerId = conversation.freelancer?._id || conversation.freelancer;

  if (clientId?.toString() === normalizedUserId) {
    return "client";
  }

  if (freelancerId?.toString() === normalizedUserId) {
    return "freelancer";
  }

  return null;
};

const getConversationForParticipant = async (conversationId, userId) =>
  Conversation.findOne({
    _id: conversationId,
    $or: [{ client: userId }, { freelancer: userId }],
  })
    .populate("client", "name email")
    .populate("freelancer", "name email")
    .populate("job", "title status category budget deadline")
    .populate("proposal", "amount deliveryDays status")
    .populate("dispute", "reason status");

const getConversationByProposalForParticipant = async (proposalId, userId) =>
  Conversation.findOne({
    proposal: proposalId,
    $or: [{ client: userId }, { freelancer: userId }],
  })
    .populate("client", "name email")
    .populate("freelancer", "name email")
    .populate("job", "title status category budget deadline")
    .populate("proposal", "amount deliveryDays status")
    .populate("dispute", "reason status");

const listConversationsForUser = async (userId) =>
  Conversation.find({
    $or: [{ client: userId }, { freelancer: userId }],
  })
    .sort({ lastMessageAt: -1 })
    .populate("client", "name email")
    .populate("freelancer", "name email")
    .populate("job", "title status")
    .populate("proposal", "status amount")
    .populate("dispute", "reason status");

const listMessagesForConversation = async (conversationId) =>
  Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name email");

const createConversationFromProposal = async (proposal, initiatorId) => {
  const existingConversation = await Conversation.findOne({
    proposal: proposal._id,
  });

  if (existingConversation) {
    return existingConversation;
  }

  const clientId = proposal.job?.creatorAddress?._id || proposal.job?.creatorAddress;
  const freelancerId = proposal.freelancer?._id || proposal.freelancer;

  if (!clientId || !freelancerId || !proposal.job?._id) {
    throw new AppError("Proposal is missing required chat context", 400);
  }

  return Conversation.create({
    proposal: proposal._id,
    job: proposal.job._id,
    client: clientId,
    freelancer: freelancerId,
    initiatedBy: initiatorId,
    kind: "proposal",
  });
};

const createAdminConversationForDispute = async (dispute, initiatorId) => {
  const existingConversation = await Conversation.findOne({
    dispute: dispute._id,
  });

  if (existingConversation) {
    return existingConversation;
  }

  const adminUser = await User.findOne({ role: "admin" }).select("_id");

  if (!adminUser) {
    return null;
  }

  return Conversation.create({
    dispute: dispute._id,
    proposal: dispute.proposal || undefined,
    job: dispute.job,
    client: dispute.openedBy,
    freelancer: adminUser._id,
    initiatedBy: initiatorId,
    kind: "dispute_support",
  });
};

const sendMessageToConversation = async (
  conversation,
  senderId,
  body,
  attachments,
) => {
  const trimmedBody = String(body || "").trim();
  const normalizedAttachments = normalizeMessageAttachments(attachments);

  if (!trimmedBody && normalizedAttachments.length === 0) {
    throw new AppError("Message cannot be empty", 400);
  }

  const senderRole = getParticipantRole(conversation, senderId);

  if (!senderRole) {
    throw new AppError("You are not allowed to message in this conversation", 403);
  }

  const recipientRole = senderRole === "client" ? "freelancer" : "client";
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    body: trimmedBody,
    attachments: normalizedAttachments,
  });

  const attachmentPreview =
    normalizedAttachments.length === 1
      ? "Sent an attachment"
      : `Sent ${normalizedAttachments.length} attachments`;
  const previewSource = trimmedBody || attachmentPreview;
  conversation.lastMessagePreview =
    previewSource.length > 180
      ? `${previewSource.slice(0, 177)}...`
      : previewSource;
  conversation.lastMessageAt = new Date();
  conversation.updatedAt = new Date();
  conversation.unreadCounts[senderRole] = 0;
  conversation.unreadCounts[recipientRole] =
    (conversation.unreadCounts?.[recipientRole] || 0) + 1;
  await conversation.save();

  return message;
};

const markConversationRead = async (conversation, userId) => {
  const participantRole = getParticipantRole(conversation, userId);

  if (!participantRole) {
    throw new AppError("You are not allowed to access this conversation", 403);
  }

  if ((conversation.unreadCounts?.[participantRole] || 0) === 0) {
    return conversation;
  }

  conversation.unreadCounts[participantRole] = 0;
  conversation.updatedAt = new Date();
  await conversation.save();
  return conversation;
};

const getUnreadConversationCountForUser = async (userId) => {
  const conversations = await Conversation.find({
    $or: [{ client: userId }, { freelancer: userId }],
  }).select("client freelancer unreadCounts");

  return conversations.reduce((total, conversation) => {
    const participantRole = getParticipantRole(conversation, userId);
    return total + (conversation.unreadCounts?.[participantRole] || 0);
  }, 0);
};

module.exports = {
  createAdminConversationForDispute,
  createConversationFromProposal,
  getConversationByProposalForParticipant,
  getConversationForParticipant,
  getParticipantRole,
  getUnreadConversationCountForUser,
  listConversationsForUser,
  listMessagesForConversation,
  markConversationRead,
  sendMessageToConversation,
};
