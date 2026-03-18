import { notFound } from "next/navigation";
import { ProposalDetailPageClient } from "@/features/proposals/components/ProposalDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getConversationByProposalServer } from "@/lib/server/chat";
import { getContractByProposalServer } from "@/lib/server/contracts";
import { getProposalByIdServer } from "@/lib/server/proposals";

export default async function ProposalDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const [proposal, conversation, contract] = await Promise.all([
    getProposalByIdServer(id),
    getConversationByProposalServer(id),
    getContractByProposalServer(id),
  ]);

  if (!proposal) {
    notFound();
  }

  return (
    <ProposalDetailPageClient
      initialConversationId={conversation?._id || null}
      initialContractId={contract?._id || null}
      initialProposal={proposal}
      initialUser={user}
    />
  );
}
