"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { reviewDisputeAction } from "@/lib/actions/admin";
import { API_BASE_URL } from "@/lib/api/config";
import { DISPUTE_STATUS } from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

export function DisputesQueueClient({ initialDisputes }) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [notesByDispute, setNotesByDispute] = useState({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const syncDisputes = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/disputes?status=all`,
          {
            credentials: "include",
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !isMounted) {
          return;
        }

        setDisputes(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        // Ignore background refresh errors to keep the admin queue usable.
      }
    };

    const intervalId = window.setInterval(syncDisputes, 5000);
    const handleFocus = () => {
      void syncDisputes();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncDisputes();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleReview = (disputeId, decision) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await reviewDisputeAction(
          disputeId,
          decision,
          notesByDispute[disputeId] || "",
        );
        setDisputes((previous) =>
          previous.map((dispute) =>
            dispute._id === disputeId ? result.data : dispute,
          ),
        );
      } catch (actionError) {
        setError(actionError.message || "Failed to update dispute.");
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
          <h1 style={{ margin: 0, fontSize: "var(--text-2xl)" }}>Disputes</h1>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 0" }}>
            Review contract disputes and close them with resolution notes.
          </p>
        </div>
        <span className="badge badge-warning">{disputes.length} total</span>
      </div>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      {disputes.length ? (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {disputes.map((dispute) => {
            const isClosed = [
              DISPUTE_STATUS.RESOLVED,
              DISPUTE_STATUS.REJECTED,
            ].includes(dispute.status);

            return (
              <article key={dispute._id} className="card-sm">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: "var(--space-1)" }}>
                      {dispute.contract?.title ||
                        dispute.job?.title ||
                        "Dispute"}
                    </h3>
                    <div className="text-light">
                      Opened by {dispute.openedBy?.name || "User"}
                    </div>
                    <div className="text-light">
                      Client: {dispute.client?.name || "Unknown"} | Freelancer:{" "}
                      {dispute.freelancer?.name || "Unknown"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      flexWrap: "wrap",
                    }}
                  >
                    {dispute.contract?._id ? (
                      <Link
                        href={`/admin/contracts/${dispute.contract._id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        View Contract
                      </Link>
                    ) : null}
                    <span className="badge badge-primary">
                      {formatStatus(dispute.status)}
                    </span>
                  </div>
                </div>

                <p style={{ marginBottom: "var(--space-2)" }}>
                  <strong>Reason:</strong> {dispute.reason}
                </p>
                {dispute.description ? (
                  <p
                    className="text-secondary"
                    style={{ marginBottom: "var(--space-2)" }}
                  >
                    {dispute.description}
                  </p>
                ) : null}

                {dispute.evidenceAttachments?.length ? (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <strong>Evidence</strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "var(--space-2)",
                        marginTop: "var(--space-2)",
                      }}
                    >
                      {dispute.evidenceAttachments.map((attachment, index) => (
                        <a
                          key={`${attachment.url}-${index}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Evidence {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {dispute.resolutionNotes ? (
                  <p
                    className="text-secondary"
                    style={{ marginBottom: "var(--space-3)" }}
                  >
                    <strong>Resolution:</strong> {dispute.resolutionNotes}
                  </p>
                ) : null}

                {!isClosed ? (
                  <>
                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor={`dispute-notes-${dispute._id}`}
                      >
                        Resolution notes
                      </label>
                      <textarea
                        id={`dispute-notes-${dispute._id}`}
                        className="form-input"
                        rows={3}
                        value={notesByDispute[dispute._id] || ""}
                        onChange={(event) =>
                          setNotesByDispute((previous) => ({
                            ...previous,
                            [dispute._id]: event.target.value,
                          }))
                        }
                        placeholder="Describe the review decision"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-3)",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isPending}
                        onClick={() =>
                          handleReview(dispute._id, "refund_client")
                        }
                      >
                        {isPending ? "Saving..." : "Refund Client"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={isPending}
                        onClick={() =>
                          handleReview(dispute._id, "release_freelancer")
                        }
                      >
                        Release Freelancer
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isPending}
                        onClick={() => handleReview(dispute._id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-muted mb-0">No disputes have been opened yet.</p>
      )}
    </div>
  );
}
