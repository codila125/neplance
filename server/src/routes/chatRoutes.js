const express = require("express");
const {
  createConversationForProposal,
  getChatSummary,
  getConversation,
  getConversationByProposal,
  getConversationMessages,
  listMyConversations,
  markConversationAsRead,
  sendMessage,
} = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listMyConversations);
router.get("/summary", getChatSummary);
router.get("/proposal/:proposalId", getConversationByProposal);
router.post("/proposal/:proposalId", createConversationForProposal);
router.get("/:id", getConversation);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", sendMessage);
router.patch("/:id/read", markConversationAsRead);

module.exports = router;
