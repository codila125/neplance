import {
  CANCELLATION_STATUS,
  DISPUTE_STATUS,
} from "@/shared/constants/statuses";

export const formatContractDateTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleString("en-NP");
};

export const getContractTimelineEvents = (contract) => {
  const events = [];

  events.push({
    key: "contract-created",
    title: "Contract created",
    description: "The client created the contract from the selected proposal.",
    at: contract.createdAt,
  });

  if (contract.clientSignature?.signedAt) {
    events.push({
      key: "client-signed",
      title: "Client signed",
      description: "The client confirmed the contract terms.",
      at: contract.clientSignature.signedAt,
    });
  }

  if (contract.fundedAt) {
    events.push({
      key: "contract-funded",
      title: "Contract funded",
      description: "The client reserved the required funds for this contract.",
      at: contract.fundedAt,
    });
  }

  if (contract.freelancerSignature?.signedAt) {
    events.push({
      key: "freelancer-signed",
      title: "Freelancer signed",
      description: "The freelancer signed and activated the contract.",
      at: contract.freelancerSignature.signedAt,
    });
  }

  if (contract.freelancerSignature?.rejectedAt) {
    events.push({
      key: "freelancer-rejected",
      title: "Freelancer requested contract changes",
      description:
        contract.freelancerSignature.rejectionReason ||
        "The freelancer asked the client to revise the contract terms.",
      at: contract.freelancerSignature.rejectedAt,
    });
  }

  (contract.milestones || []).forEach((milestone, index) => {
    if (milestone.completedAt) {
      events.push({
        key: `milestone-submitted-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} submitted`,
        description:
          milestone.evidence || "The freelancer submitted this milestone.",
        at: milestone.completedAt,
      });
    }

    if (milestone.approvedAt) {
      events.push({
        key: `milestone-approved-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} approved`,
        description: "The client approved this milestone.",
        at: milestone.approvedAt,
      });
    }

    if (milestone.revisionRequestedAt) {
      events.push({
        key: `milestone-revision-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} changes requested`,
        description:
          milestone.revisionNotes || "The client requested milestone changes.",
        at: milestone.revisionRequestedAt,
      });
    }
  });

  if (contract.deliverySubmission?.submittedAt) {
    events.push({
      key: "delivery-submitted",
      title: "Final delivery submitted",
      description:
        contract.deliverySubmission.notes ||
        "The freelancer submitted the final project work.",
      at: contract.deliverySubmission.submittedAt,
    });
  }

  if (contract.deliverySubmission?.revisionRequestedAt) {
    events.push({
      key: "delivery-revision-requested",
      title: "Final delivery changes requested",
      description:
        contract.deliverySubmission.revisionNotes ||
        "The client requested changes to the final delivery.",
      at: contract.deliverySubmission.revisionRequestedAt,
    });
  }

  if (contract.cancellation?.requestedAt) {
    events.push({
      key: "cancellation-requested",
      title: "Cancellation requested",
      description:
        contract.cancellation.reason ||
        "A cancellation request was submitted for this contract.",
      at: contract.cancellation.requestedAt,
    });
  }

  if (contract.cancellation?.respondedAt) {
    events.push({
      key: "cancellation-responded",
      title:
        contract.cancellation.status === CANCELLATION_STATUS.ACCEPTED
          ? "Cancellation accepted"
          : "Cancellation rejected",
      description: "The other party responded to the cancellation request.",
      at: contract.cancellation.respondedAt,
    });
  }

  if (contract.completedAt) {
    events.push({
      key: "contract-completed",
      title: "Contract completed",
      description: "All deliverables were accepted and the contract closed.",
      at: contract.completedAt,
    });
  }

  (contract.disputes || []).forEach((dispute, index) => {
    if (dispute.createdAt) {
      events.push({
        key: `dispute-opened-${dispute._id || index}`,
        title: "Dispute opened",
        description:
          dispute.reason || "A dispute was opened for this contract.",
        at: dispute.createdAt,
      });
    }

    if (dispute.resolvedAt) {
      events.push({
        key: `dispute-closed-${dispute._id || index}`,
        title:
          dispute.status === DISPUTE_STATUS.RESOLVED
            ? "Dispute resolved"
            : "Dispute closed",
        description:
          dispute.resolutionNotes ||
          "An admin reviewed and closed this dispute.",
        at: dispute.resolvedAt,
      });
    }
  });

  return events
    .filter((event) => event.at)
    .sort((left, right) => new Date(left.at) - new Date(right.at));
};
