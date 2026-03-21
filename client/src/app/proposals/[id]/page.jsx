import { notFound } from "next/navigation";
import { ProposalDetailPageClient } from "@/features/proposals/components/ProposalDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getBookingByProposalServer } from "@/lib/server/bookings";
import { getConversationByProposalServer } from "@/lib/server/chat";
import { getContractByProposalServer } from "@/lib/server/contracts";
import { getProposalByIdServer } from "@/lib/server/proposals";

export default async function ProposalDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const [proposal, conversation, contract, booking] = await Promise.all([
    getProposalByIdServer(id),
    getConversationByProposalServer(id),
    getContractByProposalServer(id),
    getBookingByProposalServer(id),
  ]);

  if (!proposal) {
    notFound();
  }

  return (
    <ProposalDetailPageClient
      initialConversationId={conversation?._id || null}
      initialBooking={booking || null}
      initialContractId={contract?._id || null}
      initialProposal={proposal}
      initialUser={user}
    />
  );
}
