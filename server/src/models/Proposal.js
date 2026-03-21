const mongoose = require("mongoose");
const { PROPOSAL_STATUS } = require("../constants/statuses");

const proposalSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(PROPOSAL_STATUS),
    default: PROPOSAL_STATUS.PENDING,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  pricingType: {
    type: String,
    enum: ["fixed_quote", "inspection_required"],
    default: "fixed_quote",
  },
  coverLetter: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 5000,
  },
  deliveryDays: {
    type: Number,
    required: true,
    min: 1,
  },
  revisionsIncluded: {
    type: Number,
    default: 0,
    min: 0,
  },
  visitAvailableOn: Date,
  inspectionNotes: {
    type: String,
    maxlength: 3000,
  },
  attachments: {
    type: [String],
    validate: {
      validator: (values) =>
        (values || []).every((value) => /^https?:\/\//i.test(value)),
      message: "Attachments must be valid URLs",
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  withdrawnAt: Date,
  rejectedAt: Date,
  rejectionReason: {
    type: String,
    maxlength: 2000,
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

proposalSchema.index(
  { freelancer: 1, job: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [PROPOSAL_STATUS.PENDING] },
    },
  }
);

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
