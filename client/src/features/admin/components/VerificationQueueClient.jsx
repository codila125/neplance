"use client";

import { useState, useTransition } from "react";
import { reviewVerificationAction } from "@/lib/actions/admin";

export function VerificationQueueClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [reasonByUser, setReasonByUser] = useState({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDecision = (userId, decision) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await reviewVerificationAction(
          userId,
          decision,
          reasonByUser[userId] || "",
        );
        setUsers((previous) =>
          previous.map((user) => (user._id === userId ? result.data : user)),
        );
        if (decision === "approve") {
          setReasonByUser((previous) => ({ ...previous, [userId]: "" }));
        }
      } catch (actionError) {
        setError(actionError.message || "Failed to review verification.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-2xl)" }}>
            Verification Queue
          </h1>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
            Review uploaded freelancer verification documents.
          </p>
        </div>
        <span className="badge badge-primary">{users.length} pending</span>
      </div>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      {users.length > 0 ? (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {users.map((user) => (
            <article key={user._id} className="card-sm">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "var(--space-4)",
                  flexWrap: "wrap",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "var(--space-1)" }}>
                    {user.name}
                  </h3>
                  <div className="text-light">{user.email}</div>
                  <div
                    className="text-light"
                    style={{ marginTop: "var(--space-1)" }}
                  >
                    Status: {user.verificationStatus}
                  </div>
                </div>
                <span className="badge badge-warning">
                  {user.verificationDocuments?.length || 0} document(s)
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                }}
              >
                {(user.verificationDocuments || []).map((document, index) => (
                  <div
                    key={`${document.url}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      flexWrap: "wrap",
                      padding: "var(--space-3)",
                      border: "1px solid var(--color-border-light)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <div>
                      <strong>
                        {document.name || `Document ${index + 1}`}
                      </strong>
                      <div
                        className="text-light"
                        style={{ fontSize: "var(--text-sm)" }}
                      >
                        {document.resourceType || "raw"}
                      </div>
                    </div>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Open File
                    </a>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor={`verification-reason-${user._id}`}
                >
                  Rejection reason
                </label>
                <textarea
                  id={`verification-reason-${user._id}`}
                  className="form-input"
                  rows={3}
                  placeholder="Optional reason if rejecting this verification"
                  value={reasonByUser[user._id] || ""}
                  onChange={(event) =>
                    setReasonByUser((previous) => ({
                      ...previous,
                      [user._id]: event.target.value,
                    }))
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginTop: "var(--space-4)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDecision(user._id, "approve")}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDecision(user._id, "reject")}
                  disabled={isPending}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted mb-0">
          No users are currently waiting for verification review.
        </p>
      )}
    </div>
  );
}
