const Proposal = require("../models/Proposal");
const Message = require("../models/Message");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { createNotification } = require("../services/notificationService");
const {
  createConversationFromProposal,
  getConversationByProposalForParticipant,
  getConversationForParticipant,
  getParticipantRole,
  getUnreadConversationCountForUser,
  listConversationsForUser,
  listMessagesForConversation,
  markConversationRead,
  sendMessageToConversation,
} = require("../services/chatService");

const listMyConversations = catchAsync(async (req, res) => {
  const data = await listConversationsForUser(req.user.id);

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});

const getChatSummary = catchAsync(async (req, res) => {
  const unreadCount = await getUnreadConversationCountForUser(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      unreadCount,
    },
  });
});

const getConversationByProposal = catchAsync(async (req, res) => {
  const data = await getConversationByProposalForParticipant(
    req.params.proposalId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data,
  });
});

const createConversationForProposal = catchAsync(async (req, res) => {
  const proposal = await Proposal.findById(req.params.proposalId)
    .populate("freelancer", "name email")
    .populate({
      path: "job",
      select: "title creatorAddress",
      populate: { path: "creatorAddress", select: "name email" },
    });

  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const creatorId = proposal.job?.creatorAddress?._id || proposal.job?.creatorAddress;
  if (String(creatorId) !== String(req.user.id)) {
    throw new AppError("Only the client who received the proposal can start chat", 403);
  }

  const conversation = await createConversationFromProposal(proposal, req.user.id);
  const populatedConversation = await getConversationForParticipant(
    conversation._id,
    req.user.id
  );

  res.status(201).json({
    status: "success",
    data: populatedConversation,
  });
});

const getConversation = catchAsync(async (req, res) => {
  const data = await getConversationForParticipant(req.params.id, req.user.id);

  if (!data) {
    throw new AppError("Conversation not found", 404);
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

const getConversationMessages = catchAsync(async (req, res) => {
  const conversation = await getConversationForParticipant(req.params.id, req.user.id);

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const data = await listMessagesForConversation(conversation._id);

  res.status(200).json({
    status: "success",
    data,
  });
});

const sendMessage = catchAsync(async (req, res) => {
  const conversation = await getConversationForParticipant(req.params.id, req.user.id);

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const message = await sendMessageToConversation(
    conversation,
    req.user.id,
    req.body.body,
    req.body.attachments,
  );
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name email"
  );
  const participantRole = getParticipantRole(conversation, req.user.id);
  const recipientId =
    participantRole === "client" ? conversation.freelancer : conversation.client;

  await createNotification({
    recipient: recipientId,
    actor: req.user.id,
    type: "chat.message",
    title: "New message",
    message: `${req.user.name || "Someone"} sent you a message about "${conversation.job?.title || "a proposal"}".`,
    link: `/messages/${conversation._id}`,
    metadata: {
      job: conversation.job?._id || conversation.job,
      proposal: conversation.proposal?._id || conversation.proposal,
    },
  });

  res.status(201).json({
    status: "success",
    data: populatedMessage,
  });
});

const markConversationAsRead = catchAsync(async (req, res) => {
  const conversation = await getConversationForParticipant(req.params.id, req.user.id);

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const data = await markConversationRead(conversation, req.user.id);

  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports = {
  createConversationForProposal,
  getChatSummary,
  getConversation,
  getConversationByProposal,
  getConversationMessages,
  listMyConversations,
  markConversationAsRead,
  sendMessage,
};
