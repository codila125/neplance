"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAction } from "@/lib/actions/chat";
import { API_BASE_URL } from "@/lib/api/config";

const CHAT_POLL_INTERVAL_MS = 4000;

const mergeMessages = (serverMessages, currentMessages) => {
  const pendingMessages = currentMessages.filter((message) => message.pending);

  if (pendingMessages.length === 0) {
    return serverMessages;
  }

  return currentMessages;
};

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function MessageThreadView({
  contractId,
  conversation,
  currentUserId,
  messages,
}) {
  const router = useRouter();
  const formRef = useRef(null);
  const threadBodyRef = useRef(null);
  const [threadMessages, setThreadMessages] = useState(messages);
  const [composerError, setComposerError] = useState("");
  const [isSending, startSendTransition] = useTransition();
  const isClient =
    String(conversation.client?._id || conversation.client) ===
    String(currentUserId);
  const otherParticipant = isClient
    ? conversation.freelancer
    : conversation.client;
  const currentParticipant = isClient
    ? conversation.client
    : conversation.freelancer;

  useEffect(() => {
    if (!threadBodyRef.current) {
      return;
    }

    threadBodyRef.current.scrollTop = threadBodyRef.current.scrollHeight;
  });

  useEffect(() => {
    let isMounted = true;

    const syncMessages = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/chat/${conversation._id}/messages`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const nextMessages = Array.isArray(payload?.data) ? payload.data : [];

        if (!isMounted) {
          return;
        }

        setThreadMessages((currentMessages) =>
          mergeMessages(nextMessages, currentMessages),
        );
      } catch {
        // Keep the current thread state if background sync fails.
      }
    };

    syncMessages();

    const intervalId = window.setInterval(syncMessages, CHAT_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncMessages();
      }
    };

    window.addEventListener("focus", syncMessages);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncMessages);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversation._id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setComposerError("");

    const formData = new FormData(event.currentTarget);
    const body = String(formData.get("body") || "").trim();

    if (!body) {
      setComposerError("Message cannot be empty.");
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      _id: optimisticId,
      body,
      createdAt: new Date().toISOString(),
      sender: {
        _id: currentUserId,
        name: currentParticipant?.name || "You",
      },
      pending: true,
    };

    setThreadMessages((previous) => [...previous, optimisticMessage]);
    formRef.current?.reset();

    startSendTransition(async () => {
      try {
        const submitData = new FormData();
        submitData.set("body", body);
        const result = await sendMessageAction(conversation._id, submitData);
        const savedMessage = result?.data;

        setThreadMessages((previous) =>
          previous.map((message) =>
            message._id === optimisticId ? savedMessage || message : message,
          ),
        );
        router.refresh();
      } catch (error) {
        setThreadMessages((previous) =>
          previous.filter((message) => message._id !== optimisticId),
        );
        setComposerError(error.message || "Failed to send message.");
      }
    });
  };

  return (
    <div className="messages-thread card">
      <div className="messages-thread-header">
        <div>
          <h2 className="mb-2">{otherParticipant?.name || "Conversation"}</h2>
          <p className="text-muted mb-2">
            {conversation.kind === "dispute_support"
              ? `Admin support${conversation.job?.title ? ` · ${conversation.job.title}` : ""}`
              : conversation.job?.title || "Job conversation"}
          </p>
          <div className="flex gap-3 flex-wrap text-sm text-muted">
            {conversation.dispute ? (
              <span>Dispute: {conversation.dispute.reason}</span>
            ) : (
              <span>
                Proposal status: {conversation.proposal?.status || "pending"}
              </span>
            )}
            {conversation.proposal?.amount ? (
              <span>Budget offer: NPR {conversation.proposal.amount}</span>
            ) : null}
            {conversation.proposal?.deliveryDays ? (
              <span>Delivery: {conversation.proposal.deliveryDays} days</span>
            ) : null}
            {contractId ? <span>Contract created</span> : null}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {contractId ? (
            <a
              href={`/contracts/${contractId}`}
              className="btn btn-ghost btn-sm"
            >
              View Contract
            </a>
          ) : isClient &&
            ["pending", "accepted"].includes(
              conversation.proposal?.status || "",
            ) ? (
            <a
              href={`/contracts/create?proposalId=${
                conversation.proposal?._id || conversation.proposal
              }`}
              className="btn btn-secondary btn-sm"
            >
              Create Contract
            </a>
          ) : null}
        </div>
      </div>

      <div ref={threadBodyRef} className="messages-thread-body">
        {threadMessages.length === 0 ? (
          <div className="messages-empty-thread">
            No messages yet. Start the conversation here.
          </div>
        ) : (
          threadMessages.map((message) => {
            const isOwnMessage =
              String(message.sender?._id || message.sender) ===
              String(currentUserId);

            return (
              <div
                key={message._id}
                className={`message-bubble ${isOwnMessage ? "is-own" : ""} ${
                  message.pending ? "is-pending" : ""
                }`}
              >
                <div className="message-bubble-meta">
                  <strong>{message.sender?.name || "User"}</strong>
                  <span>
                    {message.pending
                      ? "Sending..."
                      : formatMessageTime(message.createdAt)}
                  </span>
                </div>
                <p className="message-bubble-text">{message.body}</p>
              </div>
            );
          })
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="messages-composer">
        <textarea
          name="body"
          className="form-input"
          placeholder="Write your message..."
          required
          rows={3}
        />
        {composerError ? (
          <p className="text-error text-sm mb-0">{composerError}</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}
