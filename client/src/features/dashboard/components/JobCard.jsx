"use client";

import Link from "next/link";
import { JOB_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  formatStatus,
  getCreatorLabel,
} from "@/shared/utils/job";

export const JobCard = ({
  job,
  variant = "default",
  onSubmitProposal,
  onPostJob,
  onDeleteJob,
  onEditJob,
}) => {
  const {
    title,
    description,
    status,
    deadline,
    creatorAddress,
    jobType,
    category,
    tags,
    attachments,
    budget,
    experienceLevel,
    location,
    isUrgent,
    proposalCount,
  } = job;
  const creatorLabel = getCreatorLabel(creatorAddress);
  const locationText = formatLocation(location, { includeAddress: false });
  const budgetDisplay = budget ? formatBudget(budget) : "Negotiable";
  const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
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

          {job.activeContract ? (
            <Link
              href={`/contracts/${
                job.activeContract?._id || job.activeContract
              }`}
              className="btn btn-ghost btn-sm"
            >
              View Contract
            </Link>
          ) : null}

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
  const budgetDisplay = job?.budget ? formatBudget(job.budget) : "N/A";

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
