import { notFound } from "next/navigation";
import { MessageThreadView } from "@/features/chat/components/MessageThreadView";
import { requireSession } from "@/lib/server/auth";
import {
  getConversationByIdServer,
  getConversationMessagesServer,
  markConversationReadServer,
} from "@/lib/server/chat";
import { getContractByProposalServer } from "@/lib/server/contracts";

export default async function MessageThreadPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const conversation = await getConversationByIdServer(id);

  if (!conversation) {
    notFound();
  }

  await markConversationReadServer(id);
  const [messages, contract] = await Promise.all([
    getConversationMessagesServer(id),
    getContractByProposalServer(
      conversation.proposal?._id || conversation.proposal,
    ),
  ]);

  return (
    <MessageThreadView
      conversation={conversation}
      contractId={contract?._id || null}
      currentUserId={user.id || user._id}
      messages={messages}
    />
  );
}
