"use client";

import { useState, useTransition } from "react";
import { reviewPaymentVerificationAction } from "@/lib/actions/admin";

export function PaymentVerificationQueueClient({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [notesById, setNotesById] = useState({});
  const [partialAmountById, setPartialAmountById] = useState({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReview = (requestId, decision) => {
    setError("");
    startTransition(async () => {
      try {
        await reviewPaymentVerificationAction(
          requestId,
          decision,
          partialAmountById[requestId] || "",
          notesById[requestId] || "",
        );
        setRequests((previous) =>
          previous.filter((request) => request._id !== requestId),
        );
      } catch (actionError) {
        setError(actionError.message || "Failed to review payment request.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <h1
        style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-2xl)" }}
      >
        Pending Payment Verification
      </h1>
      <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
        Review wallet top-up screenshots and approve, reject, or partially load
        the requested amount.
      </p>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      {requests.length ? (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {requests.map((request) => (
            <div key={request._id} className="card-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div>
                  <strong>{request.user?.name || "User"}</strong>
                  <div className="text-sm text-muted">
                    {request.user?.email}
                  </div>
                </div>
                <span className="badge badge-warning">Pending</span>
              </div>

              <div
                className="grid grid-cols-2"
                style={{ gap: "var(--space-3)" }}
              >
                <div>
                  <div className="text-sm text-muted">Requested amount</div>
                  <div className="font-semibold">
                    NPR {Number(request.requestedAmount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted">Payment method</div>
                  <div
                    className="font-semibold"
                    style={{ textTransform: "capitalize" }}
                  >
                    {request.paymentMethod}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted">Transaction ID</div>
                  <div className="font-semibold">{request.transactionId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Submitted at</div>
                  <div className="font-semibold">
                    {new Date(request.createdAt).toLocaleString("en-NP")}
                  </div>
                </div>
              </div>

              {request.screenshot?.url ? (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <a
                    href={request.screenshot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    View Screenshot
                  </a>
                </div>
              ) : null}

              <div
                className="form-group"
                style={{ marginTop: "var(--space-3)" }}
              >
                <label
                  className="form-label"
                  htmlFor={`payment-notes-${request._id}`}
                >
                  Admin notes
                </label>
                <textarea
                  id={`payment-notes-${request._id}`}
                  className="form-input"
                  rows={3}
                  value={notesById[request._id] || ""}
                  onChange={(event) =>
                    setNotesById((previous) => ({
                      ...previous,
                      [request._id]: event.target.value,
                    }))
                  }
                  placeholder="Optional review notes"
                />
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor={`payment-partial-${request._id}`}
                >
                  Partial amount
                </label>
                <input
                  id={`payment-partial-${request._id}`}
                  className="form-input"
                  type="number"
                  min="1"
                  step="1"
                  value={partialAmountById[request._id] || ""}
                  onChange={(event) =>
                    setPartialAmountById((previous) => ({
                      ...previous,
                      [request._id]: event.target.value,
                    }))
                  }
                  placeholder="Enter amount for partial approval"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isPending}
                  onClick={() => handleReview(request._id, "approve")}
                >
                  {isPending ? "Saving..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isPending}
                  onClick={() => handleReview(request._id, "partial")}
                >
                  Load Partial Amount
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={isPending}
                  onClick={() => handleReview(request._id, "reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted mb-0">No pending payment verifications.</p>
      )}
    </div>
  );
}
