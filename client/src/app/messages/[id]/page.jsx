import { notFound } from "next/navigation";
import { MessageThreadView } from "@/features/chat/components/MessageThreadView";
import { requireSession } from "@/lib/server/auth";
import {
  getConversationByIdServer,
  getConversationMessagesServer,
  markConversationReadServer,
} from "@/lib/server/chat";

export default async function MessageThreadPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const conversation = await getConversationByIdServer(id);

  if (!conversation) {
    notFound();
  }

  await markConversationReadServer(id);
  const messages = await getConversationMessagesServer(id);

  return (
    <MessageThreadView
      conversation={conversation}
      currentUserId={user.id || user._id}
      messages={messages}
    />
  );
}
