const catchAsync = require("../utils/catchAsync");
const {
  listAdminDisputes,
  resolveDispute,
} = require("../services/disputeService");
const { createNotification } = require("../services/notificationService");

const listDisputesQueue = catchAsync(async (req, res) => {
  const disputes = await listAdminDisputes(req.query.status || "all");

  res.status(200).json({
    status: "success",
    results: disputes.length,
    data: disputes,
  });
});

const reviewDispute = catchAsync(async (req, res) => {
  const dispute = await resolveDispute({
    disputeId: req.params.id,
    adminId: req.user.id,
    decision: req.body?.decision,
    resolutionNotes: req.body?.resolutionNotes,
  });

  await createNotification({
    recipient: dispute.openedBy,
    actor: req.user.id,
    type:
      dispute.status === "RESOLVED"
        ? "contract.dispute_resolved"
        : "contract.dispute_rejected",
    title:
      dispute.status === "RESOLVED" ? "Dispute resolved" : "Dispute closed",
    message:
      dispute.status === "RESOLVED"
        ? dispute.resolutionAction === "refund_client"
          ? "An admin resolved your dispute and refunded the held funds."
          : dispute.resolutionAction === "release_freelancer"
            ? "An admin resolved your dispute and released the held funds."
            : "An admin resolved your dispute."
        : "An admin closed your dispute.",
    link: `/contracts/${dispute.contract}`,
    metadata: {
      contract: dispute.contract,
      dispute: dispute._id,
      job: dispute.job,
      proposal: dispute.proposal,
    },
  });

  res.status(200).json({
    status: "success",
    data: dispute,
  });
});

module.exports = {
  listDisputesQueue,
  reviewDispute,
};
