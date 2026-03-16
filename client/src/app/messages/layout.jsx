import { MessagesLayoutShell } from "@/features/chat/components/MessagesLayoutShell";
import { requireSession } from "@/lib/server/auth";
import { listConversationsServer } from "@/lib/server/chat";

export default async function MessagesLayout({ children }) {
  const { user } = await requireSession();
  const conversations = await listConversationsServer();

  return (
    <MessagesLayoutShell
      conversations={conversations}
      currentUserId={user.id || user._id}
    >
      {children}
    </MessagesLayoutShell>
  );
}
