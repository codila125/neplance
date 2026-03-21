"use client";

import { useState, useTransition } from "react";
import {
  reviewPaymentVerificationAction,
  reviewWithdrawalReleaseAction,
} from "@/lib/actions/admin";

export function FinanceManagementClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [notesById, setNotesById] = useState({});
  const [partialAmountById, setPartialAmountById] = useState({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const summary = data?.summary || {};
  const pendingPayments = data?.pendingPayments || [];
  const pendingWithdrawals = data?.pendingWithdrawals || [];

  const handlePaymentReview = (requestId, decision) => {
    setError("");
    startTransition(async () => {
      try {
        await reviewPaymentVerificationAction(
          requestId,
          decision,
          partialAmountById[requestId] || "",
          notesById[requestId] || "",
        );
        setData((previous) => ({
          ...previous,
          pendingPayments: previous.pendingPayments.filter(
            (request) => request._id !== requestId,
          ),
        }));
      } catch (actionError) {
        setError(actionError.message || "Failed to review payment.");
      }
    });
  };

  const handleWithdrawalReview = (requestId, decision) => {
    setError("");
    startTransition(async () => {
      try {
        await reviewWithdrawalReleaseAction(
          requestId,
          decision,
          notesById[requestId] || "",
        );
        setData((previous) => ({
          ...previous,
          pendingWithdrawals: previous.pendingWithdrawals.filter(
            (request) => request._id !== requestId,
          ),
        }));
      } catch (actionError) {
        setError(actionError.message || "Failed to review withdrawal.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <h1
        style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-2xl)" }}
      >
        Finance Management
      </h1>
      <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
        Review pending wallet loads and freelancer payout releases.
      </p>

      {error ? (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Neplance total balance</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            NPR {Number(summary.platformBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Held funds</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            NPR {Number(summary.heldBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Pending top-ups</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {Number(summary.pendingTopups || 0)}
          </div>
        </div>
        <div className="card-sm" style={{ marginBottom: 0 }}>
          <div className="text-muted text-sm">Pending releases</div>
          <div
            className="font-semibold"
            style={{ marginTop: "var(--space-1)" }}
          >
            {Number(summary.pendingWithdrawals || 0)}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3" style={{ fontSize: "var(--text-xl)" }}>
          Pending Wallet Loads
        </h2>
        {pendingPayments.length ? (
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {pendingPayments.map((request) => (
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
                      NPR{" "}
                      {Number(request.requestedAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">Method</div>
                    <div
                      className="font-semibold"
                      style={{ textTransform: "capitalize" }}
                    >
                      {request.paymentMethod}
                    </div>
                  </div>
                </div>
                <div
                  className="text-sm text-muted"
                  style={{ marginTop: "var(--space-2)" }}
                >
                  Transaction ID: {request.transactionId}
                </div>
                {request.screenshot?.url ? (
                  <a
                    href={request.screenshot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "var(--space-3)" }}
                  >
                    View Screenshot
                  </a>
                ) : null}
                <div
                  className="form-group"
                  style={{ marginTop: "var(--space-3)" }}
                >
                  <label
                    className="form-label"
                    htmlFor={`finance-notes-${request._id}`}
                  >
                    Notes
                  </label>
                  <textarea
                    id={`finance-notes-${request._id}`}
                    className="form-input"
                    rows={2}
                    value={notesById[request._id] || ""}
                    onChange={(event) =>
                      setNotesById((previous) => ({
                        ...previous,
                        [request._id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor={`finance-partial-${request._id}`}
                  >
                    Partial amount
                  </label>
                  <input
                    id={`finance-partial-${request._id}`}
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
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isPending}
                    onClick={() => handlePaymentReview(request._id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isPending}
                    onClick={() => handlePaymentReview(request._id, "partial")}
                  >
                    Load Partial Amount
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={isPending}
                    onClick={() => handlePaymentReview(request._id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mb-0">No pending wallet loads.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3" style={{ fontSize: "var(--text-xl)" }}>
          Pending Release Payments
        </h2>
        {pendingWithdrawals.length ? (
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {pendingWithdrawals.map((request) => (
              <div key={request._id} className="card-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <strong>{request.user?.name || "Freelancer"}</strong>
                    <div className="text-sm text-muted">
                      {request.user?.email}
                    </div>
                  </div>
                  <span className="badge badge-warning">Pending release</span>
                </div>
                <div className="text-sm text-muted mb-2">
                  Requested withdrawal: NPR{" "}
                  {Number(request.requestedAmount || 0).toLocaleString()}
                </div>
                {request.qrAttachment?.url ? (
                  <a
                    href={request.qrAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: "var(--space-3)" }}
                  >
                    View Freelancer QR
                  </a>
                ) : null}

                {request.contractSnapshots?.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {request.contractSnapshots.map((snapshot, index) => (
                      <div
                        key={`${snapshot.contract || index}`}
                        className="card-sm"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                          <strong>
                            {snapshot.title || "Completed contract"}
                          </strong>
                          <span className="text-sm text-muted">
                            {snapshot.completedAt
                              ? new Date(
                                  snapshot.completedAt,
                                ).toLocaleDateString("en-NP")
                              : "No completion date"}
                          </span>
                        </div>
                        <div className="text-sm text-muted">
                          Amount: NPR{" "}
                          {Number(snapshot.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted">
                          Client: {snapshot.clientName || "Client"} ·
                          Freelancer: {snapshot.freelancerName || "Freelancer"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor={`release-notes-${request._id}`}
                  >
                    Notes
                  </label>
                  <textarea
                    id={`release-notes-${request._id}`}
                    className="form-input"
                    rows={2}
                    value={notesById[request._id] || ""}
                    onChange={(event) =>
                      setNotesById((previous) => ({
                        ...previous,
                        [request._id]: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isPending}
                    onClick={() =>
                      handleWithdrawalReview(request._id, "release")
                    }
                  >
                    Release Payment
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={isPending}
                    onClick={() =>
                      handleWithdrawalReview(request._id, "reject")
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mb-0">No pending release payments.</p>
        )}
      </div>
    </div>
  );
}
