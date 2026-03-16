"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { sendMessageAction } from "@/lib/actions/chat";

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function MessageThreadView({ conversation, currentUserId, messages }) {
  const router = useRouter();
  const formRef = useRef(null);
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
            {conversation.job?.title || "Job conversation"}
          </p>
          <div className="flex gap-3 flex-wrap text-sm text-muted">
            <span>
              Proposal status: {conversation.proposal?.status || "pending"}
            </span>
            {conversation.proposal?.amount ? (
              <span>Budget offer: NPR {conversation.proposal.amount}</span>
            ) : null}
            {conversation.proposal?.deliveryDays ? (
              <span>Delivery: {conversation.proposal.deliveryDays} days</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="messages-thread-body">
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
          rows={4}
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
