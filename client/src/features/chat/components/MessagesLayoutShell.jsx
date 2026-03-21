"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const formatPreviewTime = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export function MessagesLayoutShell({
  children,
  conversations,
  currentUserId,
}) {
  const pathname = usePathname();

  return (
    <main className="section section-sm">
      <div className="container">
        <div className="messages-layout">
          <aside className="messages-sidebar card">
            <div className="messages-sidebar-header">
              <h1 className="messages-sidebar-title">Messages</h1>
              <p className="text-muted mb-0">
                Proposal chats and admin support conversations.
              </p>
            </div>

            <div className="messages-conversation-list">
              {conversations.length === 0 ? (
                <div className="messages-empty-sidebar">
                  No conversations yet.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant =
                    String(conversation.client?._id || conversation.client) ===
                    String(currentUserId)
                      ? conversation.freelancer
                      : conversation.client;
                  const isActive = pathname === `/messages/${conversation._id}`;
                  const unreadCount =
                    String(conversation.client?._id || conversation.client) ===
                    String(currentUserId)
                      ? conversation.unreadCounts?.client || 0
                      : conversation.unreadCounts?.freelancer || 0;

                  return (
                    <Link
                      key={conversation._id}
                      href={`/messages/${conversation._id}`}
                      className={`messages-conversation-link ${
                        isActive ? "active" : ""
                      }`}
                    >
                      <div className="messages-conversation-top">
                        <strong>
                          {otherParticipant?.name || "Participant"}
                        </strong>
                        <span className="text-muted text-sm">
                          {formatPreviewTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="messages-conversation-job">
                        {conversation.kind === "dispute_support"
                          ? `Dispute support${conversation.job?.title ? ` · ${conversation.job.title}` : ""}`
                          : conversation.job?.title || "Job"}
                      </div>
                      <div className="messages-conversation-preview">
                        {conversation.lastMessagePreview ||
                          "Conversation started"}
                      </div>
                      {unreadCount > 0 ? (
                        <span className="messages-unread-badge">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          <section className="messages-main">{children}</section>
        </div>
      </div>
    </main>
  );
}
