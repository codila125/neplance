const mongoose = require("mongoose");

const unreadCountSchema = new mongoose.Schema(
  {
    client: {
      type: Number,
      default: 0,
      min: 0,
    },
    freelancer: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema({
  proposal: {
    type: mongoose.Schema.ObjectId,
    ref: "Proposal",
    sparse: true,
    unique: true,
  },
  dispute: {
    type: mongoose.Schema.ObjectId,
    ref: "Dispute",
    sparse: true,
    unique: true,
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  freelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  initiatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  kind: {
    type: String,
    enum: ["proposal", "dispute_support"],
    default: "proposal",
  },
  lastMessagePreview: {
    type: String,
    trim: true,
    maxlength: 200,
    default: "",
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCounts: {
    type: unreadCountSchema,
    default: () => ({ client: 0, freelancer: 0 }),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.index({ client: 1, lastMessageAt: -1 });
conversationSchema.index({ freelancer: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
