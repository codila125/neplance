const mongoose = require("mongoose");
const {
  CONTRACT_STATUS,
  CONTRACT_FUNDING_STATUS,
  CONTRACT_TYPE,
  MILESTONE_STATUS,
} = require("../constants/statuses");

const contractMilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: Date,
    status: {
      type: String,
      enum: Object.values(MILESTONE_STATUS),
      default: MILESTONE_STATUS.ACTIVE,
    },
    evidence: String,
    evidenceAttachments: {
      type: [
        {
          name: String,
          url: String,
          publicId: String,
          resourceType: String,
          uploadedAt: Date,
        },
      ],
      default: [],
    },
    completedAt: Date,
    approvedAt: Date,
    revisionRequestedAt: Date,
    revisionRequestedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    revisionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    revisionHistory: {
      type: [
        {
          notes: {
            type: String,
            trim: true,
            maxlength: 2000,
          },
          requestedAt: Date,
          requestedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          requestedByRole: {
            type: String,
            enum: ["CLIENT", "FREELANCER", "ADMIN"],
          },
        },
      ],
      default: [],
    },
    submissionHistory: {
      type: [
        {
          notes: {
            type: String,
            trim: true,
            maxlength: 5000,
          },
          attachments: {
            type: [
              {
                name: String,
                url: String,
                publicId: String,
                resourceType: String,
                uploadedAt: Date,
              },
            ],
            default: [],
          },
          submittedAt: Date,
          submittedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          submittedByRole: {
            type: String,
            enum: ["CLIENT", "FREELANCER", "ADMIN"],
          },
        },
      ],
      default: [],
    },
  },
  { _id: true }
);

const signatureSchema = new mongoose.Schema(
  {
    signedAt: Date,
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    walletAddress: String,
    signatureHash: String,
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
    index: true,
  },
  proposal: {
    type: mongoose.Schema.ObjectId,
    ref: "Proposal",
    required: true,
    unique: true,
  },
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: "Booking",
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  freelancer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  serviceMode: {
    type: String,
    enum: ["digital", "physical"],
    default: "digital",
  },
  contractType: {
    type: String,
    enum: Object.values(CONTRACT_TYPE),
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  fundingStatus: {
    type: String,
    enum: Object.values(CONTRACT_FUNDING_STATUS),
    default: CONTRACT_FUNDING_STATUS.UNFUNDED,
  },
  fundedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  releasedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  refundedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  fundedAt: Date,
  currency: {
    type: String,
    default: "NPR",
  },
  terms: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  physicalVisit: {
    isRequired: {
      type: Boolean,
      default: false,
    },
    preferredVisitDate: Date,
    preferredWorkDate: Date,
    inspectionSummary: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    materialsAgreement: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    verification: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "VERIFIED"],
        default: "NOT_REQUIRED",
      },
      otpCode: String,
      generatedAt: Date,
      generatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    },
  },
  milestones: {
    type: [contractMilestoneSchema],
    default: [],
  },
  status: {
    type: String,
    enum: Object.values(CONTRACT_STATUS),
    default: CONTRACT_STATUS.DRAFT,
  },
  clientSignature: {
    type: signatureSchema,
    default: () => ({}),
  },
  freelancerSignature: {
    type: signatureSchema,
    default: () => ({}),
  },
  deliverySubmission: {
    status: {
      type: String,
      enum: ["NONE", "SUBMITTED", "CHANGES_REQUESTED", "ACCEPTED"],
      default: "NONE",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    attachments: {
      type: [
        {
          name: String,
          url: String,
          publicId: String,
          resourceType: String,
          uploadedAt: Date,
        },
      ],
      default: [],
    },
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    revisionRequestedAt: Date,
    revisionRequestedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    revisionNotes: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    revisionHistory: {
      type: [
        {
          notes: {
            type: String,
            trim: true,
            maxlength: 3000,
          },
          requestedAt: Date,
          requestedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          requestedByRole: {
            type: String,
            enum: ["CLIENT", "FREELANCER", "ADMIN"],
          },
        },
      ],
      default: [],
    },
    submissionHistory: {
      type: [
        {
          notes: {
            type: String,
            trim: true,
            maxlength: 5000,
          },
          attachments: {
            type: [
              {
                name: String,
                url: String,
                publicId: String,
                resourceType: String,
                uploadedAt: Date,
              },
            ],
            default: [],
          },
          submittedAt: Date,
          submittedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          submittedByRole: {
            type: String,
            enum: ["CLIENT", "FREELANCER", "ADMIN"],
          },
        },
      ],
      default: [],
    },
  },
  cancellation: {
    status: {
      type: String,
      enum: ["NONE", "PENDING", "ACCEPTED", "REJECTED"],
      default: "NONE",
    },
    initiatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    initiatedRole: {
      type: String,
      enum: ["CLIENT", "FREELANCER"],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    requestedAt: Date,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    respondedAt: Date,
  },
  blockchain: {
    network: String,
    contractAddress: String,
    transactionHash: String,
    syncStatus: {
      type: String,
      enum: ["PENDING", "SYNCED", "FAILED"],
      default: "PENDING",
    },
    syncedAt: Date,
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

contractSchema.index({ client: 1, status: 1, createdAt: -1 });
contractSchema.index({ freelancer: 1, status: 1, createdAt: -1 });

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
