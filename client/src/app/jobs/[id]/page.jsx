import { notFound } from "next/navigation";
import { JobDetailPageClient } from "@/features/jobs/components/JobDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getConversationByProposalServer } from "@/lib/server/chat";
import { getJobByIdServer } from "@/lib/server/jobs";
import { getMyProposalsServer } from "@/lib/server/proposals";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";

export default async function JobDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const roleList = Array.isArray(user?.role)
    ? user.role
    : [user?.role].filter(Boolean);
  const [job, myProposals] = await Promise.all([
    getJobByIdServer(id),
    roleList.includes("freelancer")
      ? getMyProposalsServer()
      : Promise.resolve([]),
  ]);

  if (!job) {
    notFound();
  }

  const existingProposal = myProposals.find((proposal) => {
    const proposalJobId = proposal.job?._id || proposal.job;

    return (
      String(proposalJobId) === String(id) &&
      proposal.status !== PROPOSAL_STATUS.WITHDRAWN
    );
  });
  const chatProposalId =
    existingProposal?._id || job.selectedProposal?._id || job.selectedProposal;
  const conversation = chatProposalId
    ? await getConversationByProposalServer(chatProposalId)
    : null;

  return (
    <JobDetailPageClient
      conversationId={conversation?._id || null}
      existingProposalId={existingProposal?._id || null}
      initialJob={job}
      initialUser={user}
    />
  );
}
