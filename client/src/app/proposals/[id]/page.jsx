"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { apiCall } from "@/services/api";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";
import { useAuthGate } from "@/shared/hooks/useAuthGate";
import { Navbar } from "@/shared/navigation/Navbar";
import { Button, Input } from "@/shared/ui/UI";
import { formatStatus } from "@/shared/utils/job";

export default function ProposalDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [resubmitData, setResubmitData] = useState({
    amount: "",
    coverLetter: "",
    deliveryDays: "",
    revisionsIncluded: "0",
    attachments: "",
  });
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const { user, logout, switchRole } = useAuthGate({
    mode: "require-auth",
    redirectTo: "/",
  });

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await apiCall(`/api/proposals/${id}`);
        setProposal(response.data);
      } catch (err) {
        setError(err.message || "Failed to load proposal");
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  useEffect(() => {
    if (!proposal) return;
    setResubmitData({
      amount: proposal.amount?.toString() || "",
      coverLetter: proposal.coverLetter || "",
      deliveryDays: proposal.deliveryDays?.toString() || "",
      revisionsIncluded: proposal.revisionsIncluded?.toString() || "0",
      attachments: Array.isArray(proposal.attachments)
        ? proposal.attachments.join(", ")
        : "",
    });
  }, [proposal]);

  const handleReject = async () => {
    setRejectError("");
    setRejecting(true);
    try {
      const response = await apiCall(`/api/proposals/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      setProposal(response.data);
      setRejectReason("");
    } catch (err) {
      setRejectError(err.message || "Failed to reject proposal");
    } finally {
      setRejecting(false);
    }
  };

  const handleAccept = async () => {
    setAcceptError("");
    setAccepting(true);
    try {
      const response = await apiCall(`/api/proposals/${id}/accept`, {
        method: "PATCH",
      });
      setProposal(
        response.job
          ? { ...proposal, status: PROPOSAL_STATUS.ACCEPTED }
          : proposal,
      );
      if (response.acceptedProposal) {
        setProposal(response.acceptedProposal);
      }
    } catch (err) {
      setAcceptError(err.message || "Failed to accept proposal");
    } finally {
      setAccepting(false);
    }
  };

  const handleResubmitChange = (field, value) => {
    setResubmitData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResubmit = async (event) => {
    event.preventDefault();
    setResubmitError("");

    if (!resubmitData.amount || Number(resubmitData.amount) <= 0) {
      setResubmitError("Please enter a valid amount");
      return;
    }
    if (resubmitData.coverLetter.trim().length < 5) {
      setResubmitError("Cover letter must be at least 5 characters");
      return;
    }
    if (!resubmitData.deliveryDays || Number(resubmitData.deliveryDays) <= 0) {
      setResubmitError("Please enter valid delivery days");
      return;
    }

    const attachmentsArray = resubmitData.attachments
      ? resubmitData.attachments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const invalidUrl = attachmentsArray.find(
      (item) => !/^https?:\/\//i.test(item),
    );
    if (invalidUrl) {
      setResubmitError("Attachments must be valid URLs");
      return;
    }

    setResubmitting(true);

    try {
      const response = await apiCall("/api/proposals", {
        method: "POST",
        body: JSON.stringify({
          job: proposal.job?._id || proposal.job,
          amount: Number(resubmitData.amount),
          coverLetter: resubmitData.coverLetter.trim(),
          deliveryDays: Number(resubmitData.deliveryDays),
          revisionsIncluded: Number(resubmitData.revisionsIncluded) || 0,
          attachments: attachmentsArray,
        }),
      });
      const newId = response?.data?._id;
      if (newId) {
        router.push(`/proposals/${newId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setResubmitError(err.message || "Failed to resubmit proposal");
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} onLogout={logout} onRoleSwitch={switchRole} />
        <div className="dashboard">
          <div
            className="dashboard-content"
            style={{ textAlign: "center", padding: "var(--space-16)" }}
          >
            <div>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar user={user} onLogout={logout} onRoleSwitch={switchRole} />
        <div className="dashboard">
          <div
            className="dashboard-content"
            style={{ textAlign: "center", padding: "var(--space-16)" }}
          >
            <div style={{ color: "var(--color-error)" }}>{error}</div>
            <Button
              variant="secondary"
              onClick={() => router.back()}
              style={{ marginTop: "var(--space-4)" }}
            >
              Go Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === PROPOSAL_STATUS.ACCEPTED) return "badge-success";
    if (statusLower === PROPOSAL_STATUS.PENDING) return "badge-warning";
    if (statusLower === PROPOSAL_STATUS.REJECTED) return "badge-error";
    return "";
  };

  const currentUserId = user?.id || user?._id;
  const freelancerId =
    proposal?.freelancer?._id || proposal?.freelancer || proposal?.freelancerId;
  const creatorId =
    proposal?.job?.creatorAddress?._id || proposal?.job?.creatorAddress;
  const jobRoles = Array.isArray(proposal?.job?.parties)
    ? proposal.job.parties
    : [];
  const isCreatorParty = jobRoles.some(
    (party) =>
      party.role === "CREATOR" &&
      String(party.address) === String(currentUserId),
  );
  const isClient =
    currentUserId &&
    (String(creatorId) === String(currentUserId) || isCreatorParty);
  const isFreelancer =
    currentUserId && String(freelancerId) === String(currentUserId);
  const canReject = isClient && proposal?.status === PROPOSAL_STATUS.PENDING;
  const canAccept = isClient && proposal?.status === PROPOSAL_STATUS.PENDING;
  const canResubmit =
    isFreelancer && proposal?.status === PROPOSAL_STATUS.REJECTED;

  return (
    <>
      <Navbar user={user} onLogout={logout} onRoleSwitch={switchRole} />
      <div className="dashboard">
        <div className="dashboard-content">
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Button variant="ghost" onClick={() => router.back()}>
              ← Back
            </Button>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-6)",
              }}
            >
              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-weight-semibold)",
                  margin: 0,
                }}
              >
                Proposal
              </h1>
              <span className={`badge ${getStatusBadgeClass(proposal.status)}`}>
                {formatStatus(proposal.status)}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Amount
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-primary)",
                  }}
                >
                  NPR {proposal.amount?.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Delivery
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {proposal.deliveryDays} days
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Revisions
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {proposal.revisionsIncluded || 0}
                </div>
              </div>
            </div>

            {proposal.freelancer && (
              <div
                style={{
                  marginBottom: "var(--space-6)",
                  padding: "var(--space-4)",
                  background: "var(--color-bg-secondary)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Freelancer
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary-lightest)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {(
                      proposal.freelancer.name ||
                      proposal.freelancer.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                      {proposal.freelancer.name || "Unknown"}
                    </div>
                    {proposal.freelancer.email && (
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-light)",
                        }}
                      >
                        {proposal.freelancer.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {proposal.coverLetter && (
              <div style={{ marginBottom: "var(--space-6)" }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Cover Letter
                </div>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    background: "var(--color-bg-secondary)",
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  {proposal.coverLetter}
                </p>
              </div>
            )}

            {proposal.rejectionReason && (
              <div style={{ marginBottom: "var(--space-6)" }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Rejection Reason
                </div>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    background: "var(--color-bg-secondary)",
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  {proposal.rejectionReason}
                </p>
              </div>
            )}

            {canResubmit && (
              <div style={{ marginTop: "var(--space-6)" }}>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--font-weight-semibold)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Resubmit Proposal
                </h3>
                <form
                  onSubmit={handleResubmit}
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  <Input
                    type="number"
                    label="Your Amount (NPR)"
                    placeholder="Enter amount"
                    value={resubmitData.amount}
                    onChange={(e) =>
                      handleResubmitChange("amount", e.target.value)
                    }
                    min="1"
                    required
                    disabled={resubmitting}
                  />

                  <div style={{ marginTop: "var(--space-4)" }}>
                    <label
                      htmlFor="resubmitCoverLetter"
                      style={{
                        display: "block",
                        marginBottom: "var(--space-2)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Cover Letter *
                    </label>
                    <textarea
                      id="resubmitCoverLetter"
                      value={resubmitData.coverLetter}
                      onChange={(e) =>
                        handleResubmitChange("coverLetter", e.target.value)
                      }
                      placeholder="Describe why you're the best fit for this job..."
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--color-border)",
                        fontFamily: "inherit",
                        fontSize: "var(--text-sm)",
                        resize: "vertical",
                      }}
                      maxLength={5000}
                      required
                      disabled={resubmitting}
                    />
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-light)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      {resubmitData.coverLetter.length}/5000 characters
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-4)",
                      marginTop: "var(--space-4)",
                    }}
                  >
                    <Input
                      type="number"
                      label="Delivery Days *"
                      placeholder="e.g., 7"
                      value={resubmitData.deliveryDays}
                      onChange={(e) =>
                        handleResubmitChange("deliveryDays", e.target.value)
                      }
                      min="1"
                      required
                      disabled={resubmitting}
                    />
                    <Input
                      type="number"
                      label="Revisions Included"
                      placeholder="e.g., 2"
                      value={resubmitData.revisionsIncluded}
                      onChange={(e) =>
                        handleResubmitChange(
                          "revisionsIncluded",
                          e.target.value,
                        )
                      }
                      min="0"
                      disabled={resubmitting}
                    />
                  </div>

                  <div style={{ marginTop: "var(--space-4)" }}>
                    <Input
                      type="text"
                      label="Attachments (comma-separated URLs)"
                      placeholder="https://example.com/file1.pdf, https://example.com/file2.pdf"
                      value={resubmitData.attachments}
                      onChange={(e) =>
                        handleResubmitChange("attachments", e.target.value)
                      }
                      disabled={resubmitting}
                    />
                  </div>

                  {resubmitError && (
                    <p
                      className="card-error"
                      style={{ marginTop: "var(--space-3)" }}
                    >
                      {resubmitError}
                    </p>
                  )}

                  <div style={{ marginTop: "var(--space-4)" }}>
                    <Button type="submit" disabled={resubmitting}>
                      {resubmitting ? "Resubmitting..." : "Resubmit Proposal"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {proposal.attachments?.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Attachments
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {proposal.attachments.map((attachment, index) => (
                    <a
                      key={attachment || index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{
                        justifyContent: "flex-start",
                        textDecoration: "none",
                      }}
                    >
                      📎 Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {canAccept && (
              <div style={{ marginTop: "var(--space-6)" }}>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--font-weight-semibold)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Accept Proposal
                </h3>
                <div
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  {acceptError && (
                    <p
                      className="card-error"
                      style={{ marginBottom: "var(--space-3)" }}
                    >
                      {acceptError}
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              </div>
            )}

            {canReject && (
              <div style={{ marginTop: "var(--space-6)" }}>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--font-weight-semibold)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Reject Proposal
                </h3>
                <div
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  <label
                    htmlFor="rejectReason"
                    style={{
                      display: "block",
                      marginBottom: "var(--space-2)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Rejection Reason
                  </label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Share why you are rejecting this proposal"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontFamily: "inherit",
                      fontSize: "var(--text-sm)",
                      resize: "vertical",
                    }}
                    disabled={rejecting}
                  />
                  {rejectError && (
                    <p
                      className="card-error"
                      style={{ marginTop: "var(--space-2)" }}
                    >
                      {rejectError}
                    </p>
                  )}
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleReject}
                      disabled={rejecting}
                    >
                      {rejecting ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
