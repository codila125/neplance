const toUnixSeconds = (value) => {
  const date = value ? new Date(value) : new Date();
  const ms = Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
  return Math.floor(ms / 1000);
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const resolveDueDate = ({ milestoneDueDate, contract, contractCreatedAt }) => {
  const milestoneDate = milestoneDueDate ? new Date(milestoneDueDate) : null;
  if (milestoneDate && !Number.isNaN(milestoneDate.getTime())) {
    return milestoneDate;
  }

  const jobDeadline = contract?.job?.deadline ? new Date(contract.job.deadline) : null;
  if (jobDeadline && !Number.isNaN(jobDeadline.getTime())) {
    return jobDeadline;
  }

  const createdAt = contractCreatedAt ? new Date(contractCreatedAt) : new Date();
  const baseMs = Number.isNaN(createdAt.getTime()) ? Date.now() : createdAt.getTime();
  return new Date(baseMs + 7 * DAY_IN_MS);
};

const toMilestoneValue = (value) => {
  const normalized = Math.round(Number(value) || 0);
  return normalized > 0 ? normalized : 1;
};

const mapMilestones = (contract) => {
  const milestones = Array.isArray(contract?.milestones) ? contract.milestones : [];
  const contractCreatedAt = contract?.createdAt;

  if (milestones.length > 0) {
    return milestones.map((milestone) => ({
      title: milestone?.title || contract.title,
      description: milestone?.description || contract.description || "",
      value: toMilestoneValue(milestone?.value),
      due_date: toUnixSeconds(
        resolveDueDate({
          milestoneDueDate: milestone?.dueDate,
          contract,
          contractCreatedAt,
        })
      ),
    }));
  }

  return [
    {
      title: contract?.title || "Contract Milestone",
      description:
        contract?.description ||
        contract?.terms ||
        "Default milestone created from contract details",
      value: toMilestoneValue(contract?.totalAmount),
      due_date: toUnixSeconds(resolveDueDate({ contract, contractCreatedAt })),
    },
  ];
};

const mapContractToCreatePayload = ({ contract, freelancerWalletId }) => {
  const jobAttachments = Array.isArray(contract?.job?.attachments)
    ? contract.job.attachments
    : [];
  const proposalAttachments = Array.isArray(contract?.proposal?.attachments)
    ? contract.proposal.attachments
    : [];
  const attachments = [...new Set([...jobAttachments, ...proposalAttachments])].filter(
    (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim())
  );

  return {
    title: contract.title,
    description: contract.description || "",
    milestones: mapMilestones(contract),
    parties: [
      {
        address: freelancerWalletId,
        role: "CONTRACTOR",
      },
    ],
    terms: contract.terms || contract.description || contract.title,
    attachments,
  };
};

module.exports = {
  mapContractToCreatePayload,
};
