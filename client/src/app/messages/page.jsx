import { redirect } from "next/navigation";
import { requireSession } from "@/lib/server/auth";
import { listConversationsServer } from "@/lib/server/chat";

export default async function MessagesIndexPage() {
  await requireSession();
  const conversations = await listConversationsServer();

  if (conversations[0]?._id) {
    redirect(`/messages/${conversations[0]._id}`);
  }

  return (
    <div className="card">
      <h2 className="mb-3">No conversations yet</h2>
      <p className="text-muted mb-0">
        A client can start a conversation from a received proposal. Once that
        happens, the conversation will appear here for both sides.
      </p>
    </div>
  );
}
