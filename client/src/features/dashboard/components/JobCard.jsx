"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CANCELLATION_STATUS,
  JOB_STATUS,
  PROPOSAL_STATUS,
} from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  formatStatus,
  getCreatorLabel,
  getMilestoneTotal,
  hasMilestones,
} from "@/shared/utils/job";

export const JobCard = ({
  job,
  variant = "default",
  onSubmitProposal,
  onPostJob,
  onDeleteJob,
  onEditJob,
  currentUser,
  onRequestCancellation,
  onRespondCancellation,
}) => {
  const {
    title,
    description,
    milestones,
    status,
    deadline,
    creatorAddress,
    jobType,
    category,
    tags,
    attachments,
    budget,
    budgetType,
    experienceLevel,
    location,
    isUrgent,
    proposalCount,
  } = job;
  const totalValue = hasMilestones(milestones)
    ? getMilestoneTotal(milestones)
    : null;
  const creatorLabel = getCreatorLabel(creatorAddress);
  const locationText = formatLocation(location, { includeAddress: false });
  const budgetDisplay = budget
    ? formatBudget(budget, budgetType)
    : totalValue !== null
      ? `NPR ${totalValue.toLocaleString()}`
      : "Negotiable";
  const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
  const milestoneCount = Array.isArray(milestones) ? milestones.length : 0;
  const deadlineText = deadline
    ? new Date(deadline).toLocaleDateString("en-NP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const isDraft = status === JOB_STATUS.DRAFT;
  const isOpen = status === JOB_STATUS.OPEN;
  const canEdit = isDraft || isOpen;
  const currentUserId = currentUser?.id || currentUser?._id;
  const isCreator =
    currentUser &&
    (creatorAddress?._id === currentUserId ||
      creatorAddress === currentUserId ||
      creatorAddress?.id === currentUserId);
  const isContractor = (job.parties || []).some(
    (party) =>
      party.role === "CONTRACTOR" &&
      String(party.address) === String(currentUserId),
  );
  const canCancel =
    status === JOB_STATUS.IN_PROGRESS && (isCreator || isContractor);
  const cancellation = job.cancellation || { status: CANCELLATION_STATUS.NONE };
  const initiatedBy = cancellation.initiatedBy?._id || cancellation.initiatedBy;
  const isInitiator = initiatedBy
    ? String(initiatedBy) === String(currentUserId)
    : cancellation.initiatedRole
      ? (cancellation.initiatedRole === "CREATOR" && isCreator) ||
        (cancellation.initiatedRole === "CONTRACTOR" && isContractor)
      : false;
  const hasPendingCancellation =
    cancellation.status === CANCELLATION_STATUS.PENDING;
  const canRespondCancellation =
    hasPendingCancellation &&
    !isInitiator &&
    canCancel &&
    currentUser &&
    onRespondCancellation;

  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);

  const handleRequestCancellation = async () => {
    if (!onRequestCancellation) return;
    setCancellationError("");
    setRequestLoading(true);
    try {
      await onRequestCancellation(job, cancellationReason);
      setCancellationReason("");
    } catch (err) {
      setCancellationError(err.message || "Failed to request cancellation");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRespondCancellation = async (action) => {
    if (!onRespondCancellation) return;
    setCancellationError("");
    setResponseLoading(true);
    try {
      await onRespondCancellation(job, action);
    } catch (err) {
      setCancellationError(err.message || "Failed to respond to cancellation");
    } finally {
      setResponseLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === JOB_STATUS.DRAFT.toLowerCase()) return "badge-warning";
    if (statusLower === JOB_STATUS.OPEN.toLowerCase()) return "badge-success";
    if (
      statusLower === JOB_STATUS.IN_PROGRESS.toLowerCase() ||
      statusLower === "active"
    )
      return "badge-primary";
    if (statusLower === JOB_STATUS.COMPLETED.toLowerCase()) return "badge-info";
    if (statusLower === JOB_STATUS.CANCELLED.toLowerCase())
      return "badge-error";
    return "";
  };

  return (
    <article className="card">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-light)",
        }}
      >
        {deadlineText && <span>Due: {deadlineText}</span>}
        {milestoneCount > 0 && <span>Milestones: {milestoneCount}</span>}
        {attachmentCount > 0 && <span>Attachments: {attachmentCount}</span>}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "var(--space-4)",
        }}
      >
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
              fontSize: "var(--text-lg)",
            }}
          >
            {creatorLabel.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text)",
              }}
            >
              {creatorLabel}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
          }}
        >
          {isUrgent && <span className="badge badge-error">Urgent</span>}
          <span className={`badge ${getStatusBadgeClass(status)}`}>
            {formatStatus(status)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <h3
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--space-2)",
          }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-light">
            {description.length > 150
              ? `${description.slice(0, 150)}...`
              : description}
          </p>
        )}

        {(canCancel || cancellation.status !== CANCELLATION_STATUS.NONE) && (
          <div
            style={{
              marginTop: "var(--space-4)",
              padding: "var(--space-3)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                alignItems: "center",
                marginBottom: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-warning">
                {formatStatus(cancellation.status || CANCELLATION_STATUS.NONE)}
              </span>
              {cancellation.initiatedRole && (
                <span style={{ fontSize: "var(--text-xs)" }}>
                  Initiated by: {cancellation.initiatedRole.toLowerCase()}
                </span>
              )}
            </div>

            {cancellation.reason && (
              <p className="text-light">Reason: {cancellation.reason}</p>
            )}

            {hasPendingCancellation ? (
              isInitiator ? (
                <p className="text-light">
                  Waiting for the other party to respond.
                </p>
              ) : (
                canRespondCancellation && (
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRespondCancellation("accept")}
                      disabled={responseLoading}
                    >
                      {responseLoading ? "Processing..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRespondCancellation("reject")}
                      disabled={responseLoading}
                    >
                      Reject
                    </button>
                  </div>
                )
              )
            ) : (
              canCancel &&
              onRequestCancellation && (
                <div>
                  <label
                    htmlFor={`cancellation-${job._id}`}
                    style={{
                      display: "block",
                      marginBottom: "var(--space-1)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    Cancellation Reason
                  </label>
                  <textarea
                    id={`cancellation-${job._id}`}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Share why you are cancelling (optional)"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontFamily: "inherit",
                      fontSize: "var(--text-xs)",
                      resize: "vertical",
                    }}
                    disabled={requestLoading}
                  />
                  <div style={{ marginTop: "var(--space-2)" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleRequestCancellation}
                      disabled={requestLoading}
                    >
                      {requestLoading
                        ? "Requesting..."
                        : "Request Cancellation"}
                    </button>
                  </div>
                </div>
              )
            )}

            {cancellationError && (
              <p className="card-error" style={{ marginTop: "var(--space-2)" }}>
                {cancellationError}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginBottom: "var(--space-4)",
        }}
      >
        {category && (
          <span
            className="badge"
            style={{
              background: "var(--color-primary-lightest)",
              color: "var(--color-primary)",
            }}
          >
            {category}
          </span>
        )}
        {jobType && (
          <span
            className="badge"
            style={{
              background: "var(--color-secondary-lightest)",
              color: "var(--color-secondary)",
            }}
          >
            {jobType}
          </span>
        )}
        {experienceLevel && (
          <span
            className="badge"
            style={{
              background: "var(--color-warning-lightest)",
              color: "var(--color-warning-dark)",
            }}
          >
            {experienceLevel}
          </span>
        )}
        {tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="badge"
            style={{ background: "var(--color-border-light)" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {locationText && (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-light)",
            marginBottom: "var(--space-3)",
          }}
        >
          📍 {locationText}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid var(--color-border-light)",
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
            Budget
          </div>
          <div
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text)",
            }}
          >
            {budgetDisplay}
          </div>
          {(proposalCount > 0 || attachmentCount > 0) && (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-light)",
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              {proposalCount > 0 && <span>{proposalCount} proposals</span>}
              {attachmentCount > 0 && <span>{attachmentCount} files</span>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Link href={`/jobs/${job._id}`} className="btn btn-ghost btn-sm">
            View Details
          </Link>

          {isDraft && onPostJob && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onPostJob?.(job)}
            >
              Post
            </button>
          )}

          {canEdit && onEditJob && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onEditJob?.(job)}
            >
              Edit
            </button>
          )}

          {canEdit && onDeleteJob && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-error)" }}
              onClick={() => onDeleteJob?.(job)}
            >
              Delete
            </button>
          )}

          {variant === "find" && !isDraft && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onSubmitProposal?.(job)}
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProposalCard = ({ proposal, onWithdraw }) => {
  const {
    job,
    amount,
    status,
    coverLetter,
    deliveryDays,
    revisionsIncluded,
    attachments,
    rejectionReason,
  } = proposal;
  const jobTitle = job?.title || "Unknown Contract";
  const creatorLabel = getCreatorLabel(job?.creatorAddress);
  const totalValue = hasMilestones(job?.milestones)
    ? getMilestoneTotal(job?.milestones)
    : null;
  const budgetDisplay = job?.budget
    ? formatBudget(job.budget, job.budgetType)
    : totalValue !== null
      ? `NPR ${totalValue.toLocaleString()}`
      : "N/A";

  const getProposalStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === PROPOSAL_STATUS.ACCEPTED) return "badge-success";
    if (statusLower === PROPOSAL_STATUS.PENDING) return "badge-warning";
    if (statusLower === PROPOSAL_STATUS.REJECTED) return "badge-error";
    if (statusLower === PROPOSAL_STATUS.WITHDRAWN) return "badge-info";
    return "";
  };

  return (
    <article className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "var(--space-4)",
        }}
      >
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
              fontSize: "var(--text-lg)",
            }}
          >
            {creatorLabel.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text)",
              }}
            >
              {creatorLabel}
            </div>
          </div>
        </div>
        <span className={`badge ${getProposalStatusBadgeClass(status)}`}>
          {formatStatus(status)}
        </span>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <h3
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--space-2)",
          }}
        >
          {jobTitle}
        </h3>
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            marginBottom: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-light)",
              }}
            >
              Your Proposal:{" "}
            </span>
            <span
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-primary)",
              }}
            >
              NPR {amount?.toLocaleString() || "N/A"}
            </span>
          </div>
          {deliveryDays && (
            <div>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-light)",
                }}
              >
                Delivery:{" "}
              </span>
              <span
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                {deliveryDays} days
              </span>
            </div>
          )}
          {revisionsIncluded !== undefined && (
            <div>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-light)",
                }}
              >
                Revisions:{" "}
              </span>
              <span
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                {revisionsIncluded}
              </span>
            </div>
          )}
        </div>
        {coverLetter && (
          <div style={{ marginBottom: "var(--space-3)" }}>
            <p className="text-light">
              {coverLetter.length > 150
                ? `${coverLetter.slice(0, 150)}...`
                : coverLetter}
            </p>
          </div>
        )}
        {status === PROPOSAL_STATUS.REJECTED && rejectionReason && (
          <div
            style={{
              marginBottom: "var(--space-3)",
              padding: "var(--space-3)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-light)",
                marginBottom: "var(--space-1)",
              }}
            >
              Rejection reason
            </div>
            <div style={{ fontSize: "var(--text-sm)" }}>{rejectionReason}</div>
          </div>
        )}
        {attachments?.length > 0 && (
          <div style={{ marginBottom: "var(--space-3)" }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-light)",
              }}
            >
              Attachments:{" "}
            </span>
            <span style={{ fontSize: "var(--text-sm)" }}>
              {attachments.length} file(s)
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid var(--color-border-light)",
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
            Contract Value
          </div>
          <div
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text)",
            }}
          >
            {budgetDisplay}
          </div>
        </div>
        <Link
          href={`/proposals/${proposal._id}`}
          className="btn btn-ghost btn-sm"
        >
          View Details
        </Link>
        {status === PROPOSAL_STATUS.REJECTED && (
          <Link
            href={`/proposals/${proposal._id}`}
            className="btn btn-primary btn-sm"
          >
            Resubmit
          </Link>
        )}
        {status === PROPOSAL_STATUS.PENDING && onWithdraw && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--color-error)" }}
            onClick={() => onWithdraw(proposal)}
          >
            Withdraw
          </button>
        )}
      </div>
    </article>
  );
};
