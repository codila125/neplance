const Contract = require("../models/Contract");
const Dispute = require("../models/Dispute");
const AppError = require("../utils/appError");
const { CONTRACT_STATUS, DISPUTE_STATUS } = require("../constants/statuses");
const {
  refundContractFunds,
  releaseContractFunds,
  updateFundingStatus,
} = require("./walletService");

const canOpenDisputeForStatus = new Set([
  CONTRACT_STATUS.ACTIVE,
  CONTRACT_STATUS.COMPLETED,
  CONTRACT_STATUS.CANCELLED,
]);

const normalizeEvidenceAttachments = (attachments = []) => {
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

const ensureParticipant = (contract, userId) => {
  if (
    String(contract.client) !== String(userId) &&
    String(contract.freelancer) !== String(userId)
  ) {
    throw new AppError("You are not a participant in this contract", 403);
  }
};

const createContractDispute = async ({ contract, userId, payload }) => {
  ensureParticipant(contract, userId);

  if (!canOpenDisputeForStatus.has(contract.status)) {
    throw new AppError("This contract is not eligible for disputes yet", 400);
  }

  const existingOpenDispute = await Dispute.findOne({
    contract: contract._id,
    status: {
      $in: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.UNDER_REVIEW],
    },
  });

  if (existingOpenDispute) {
    throw new AppError("This contract already has an open dispute", 400);
  }

  const reason = String(payload?.reason || "").trim();
  const description = String(payload?.description || "").trim();

  if (!reason) {
    throw new AppError("Please provide a dispute reason", 400);
  }

  const dispute = await Dispute.create({
    contract: contract._id,
    job: contract.job,
    proposal: contract.proposal,
    client: contract.client,
    freelancer: contract.freelancer,
    openedBy: userId,
    reason,
    description,
    evidenceAttachments: normalizeEvidenceAttachments(
      payload?.evidenceAttachments
    ),
    status: DISPUTE_STATUS.OPEN,
    updatedAt: new Date(),
  });

  return dispute;
};

const listDisputesForContracts = async (contractIds) => {
  if (!Array.isArray(contractIds) || contractIds.length === 0) {
    return [];
  }

  return Dispute.find({ contract: { $in: contractIds } })
    .populate("openedBy", "name email avatar")
    .populate("resolvedBy", "name email avatar")
    .sort({ createdAt: -1 });
};

const listAdminDisputes = async (status = "all") => {
  const query =
    status === "all"
      ? {}
      : {
          status,
        };

  return Dispute.find(query)
    .populate("openedBy", "name email avatar role")
    .populate("resolvedBy", "name email avatar role")
    .populate("client", "name email avatar")
    .populate("freelancer", "name email avatar")
    .populate(
      "contract",
      "title status contractType totalAmount currency fundingStatus fundedAmount releasedAmount refundedAmount"
    )
    .populate("job", "title")
    .sort({ createdAt: -1 });
};

const resolveDispute = async ({
  disputeId,
  adminId,
  decision,
  resolutionNotes,
}) => {
  if (!["refund_client", "release_freelancer", "reject"].includes(decision)) {
    throw new AppError(
      "Decision must be refund_client, release_freelancer, or reject",
      400
    );
  }

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new AppError("Dispute not found", 404);
  }

  if (
    [DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.REJECTED].includes(dispute.status)
  ) {
    throw new AppError("This dispute has already been closed", 400);
  }

  const contract = await Contract.findById(dispute.contract);
  if (!contract) {
    throw new AppError("The related contract no longer exists", 404);
  }

  const remainingHeld =
    Number(contract.fundedAmount || 0) -
    Number(contract.releasedAmount || 0) -
    Number(contract.refundedAmount || 0);

  if (decision === "refund_client") {
    if (remainingHeld > 0) {
      await refundContractFunds({
        contract,
        amount: remainingHeld,
        description: `Admin refunded held funds for contract "${contract.title}"`,
      });
    }
    contract.status = CONTRACT_STATUS.CANCELLED;
  } else if (decision === "release_freelancer") {
    if (remainingHeld > 0) {
      await releaseContractFunds({
        contract,
        amount: remainingHeld,
        description: `Admin released held funds for contract "${contract.title}"`,
      });
    }
    contract.status = CONTRACT_STATUS.COMPLETED;
    if (!contract.completedAt) {
      contract.completedAt = new Date();
    }
  }

  updateFundingStatus(contract);
  contract.updatedAt = new Date();
  await contract.save();

  dispute.status =
    decision === "reject" ? DISPUTE_STATUS.REJECTED : DISPUTE_STATUS.RESOLVED;
  dispute.resolutionAction = decision;
  dispute.resolutionNotes = String(resolutionNotes || "").trim();
  dispute.resolvedBy = adminId;
  dispute.resolvedAt = new Date();
  dispute.updatedAt = new Date();
  await dispute.save();

  return dispute;
};

module.exports = {
  createContractDispute,
  listAdminDisputes,
  listDisputesForContracts,
  resolveDispute,
};
