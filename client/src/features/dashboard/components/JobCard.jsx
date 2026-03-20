"use client";

import Link from "next/link";
import { JOB_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  formatStatus,
  getCreatorLabel,
} from "@/shared/utils/job";

function Avatar({ person, fallback }) {
  if (person?.avatar) {
    return (
      <img
        src={person.avatar}
        alt={person.name || fallback}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  return (
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
      {fallback.charAt(0).toUpperCase()}
    </div>
  );
}

export const JobCard = ({
  existingProposalId = null,
  job,
  variant = "default",
  onSubmitProposal,
  onPostJob,
  onDeleteJob,
  onEditJob,
  onToggleSave,
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
    hiredFreelancer,
    proposalPreviews,
    isSaved,
  } = job;

  const creatorLabel = getCreatorLabel(creatorAddress);
  const locationText = formatLocation(location, { includeAddress: false });
  const budgetDisplay = budget ? formatBudget(budget) : "Negotiable";
  const attachmentList = Array.isArray(attachments) ? attachments : [];
  const attachmentCount = attachmentList.length;
  const attachmentPreview = attachmentList.slice(0, 2);
  const proposalPreviewList = Array.isArray(proposalPreviews)
    ? proposalPreviews.slice(0, 2)
    : [];
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
  const creatorReviewSummary = creatorAddress?.reviewSummary || {
    averageRating: "0.0",
    totalReviews: 0,
  };
  const creatorIsVerified = creatorAddress?.verificationStatus === "verified";

  const getStatusBadgeClass = (value) => {
    const statusLower = value?.toLowerCase();
    if (statusLower === JOB_STATUS.DRAFT.toLowerCase()) return "badge-warning";
    if (statusLower === JOB_STATUS.OPEN.toLowerCase()) return "badge-success";
    if (
      statusLower === JOB_STATUS.IN_PROGRESS.toLowerCase() ||
      statusLower === "active"
    ) {
      return "badge-primary";
    }
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
          <Avatar person={creatorAddress} fallback={creatorLabel} />
          <div>
            <div
              style={{
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text)",
              }}
            >
              {creatorLabel}
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
                marginTop: "var(--space-1)",
              }}
            >
              {creatorIsVerified ? (
                <span className="badge badge-success">Verified client</span>
              ) : null}
              {Number(creatorReviewSummary.totalReviews || 0) > 0 ? (
                <span className="badge">
                  {creatorReviewSummary.averageRating}/5 ·{" "}
                  {creatorReviewSummary.totalReviews} review
                  {Number(creatorReviewSummary.totalReviews) === 1 ? "" : "s"}
                </span>
              ) : null}
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
        {description ? (
          <p className="text-light">
            {description.length > 150
              ? `${description.slice(0, 150)}...`
              : description}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginBottom: "var(--space-4)",
        }}
      >
        {category ? (
          <span
            className="badge"
            style={{
              background: "var(--color-primary-lightest)",
              color: "var(--color-primary)",
            }}
          >
            {category}
          </span>
        ) : null}
        {jobType ? (
          <span
            className="badge"
            style={{
              background: "var(--color-secondary-lightest)",
              color: "var(--color-secondary)",
            }}
          >
            {jobType}
          </span>
        ) : null}
        {experienceLevel ? (
          <span
            className="badge"
            style={{
              background: "var(--color-warning-lightest)",
              color: "var(--color-warning-dark)",
            }}
          >
            {experienceLevel}
          </span>
        ) : null}
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

      {locationText ? (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-light)",
            marginBottom: "var(--space-3)",
          }}
        >
          Location: {locationText}
        </div>
      ) : null}

      {attachmentPreview.length > 0 ? (
        <div
          style={{
            marginBottom: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-light)",
            }}
          >
            Job attachments
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}
          >
            {attachmentPreview.map((attachment, index) => (
              <a
                key={attachment}
                href={attachment}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                File {index + 1}
              </a>
            ))}
            {attachmentCount > attachmentPreview.length ? (
              <span className="text-light" style={{ alignSelf: "center" }}>
                +{attachmentCount - attachmentPreview.length} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {hiredFreelancer ? (
        <div className="card-sm" style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "center",
              }}
            >
              <Avatar
                person={hiredFreelancer}
                fallback={hiredFreelancer.name || hiredFreelancer.email || "F"}
              />
              <div>
                <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                  {hiredFreelancer.name || "Assigned freelancer"}
                </div>
                <div
                  className="text-light"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  {hiredFreelancer.experienceLevel
                    ? formatStatus(hiredFreelancer.experienceLevel)
                    : "Freelancer assigned"}
                </div>
              </div>
            </div>
            {hiredFreelancer._id || hiredFreelancer.id ? (
              <Link
                href={`/freelancers/${hiredFreelancer._id || hiredFreelancer.id}`}
                className="btn btn-ghost btn-sm"
              >
                View Freelancer
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {proposalPreviewList.length > 0 ? (
        <div className="card-sm" style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            <strong>Recent Proposals</strong>
            <span className="text-light" style={{ fontSize: "var(--text-sm)" }}>
              {proposalCount} received
            </span>
          </div>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {proposalPreviewList.map((proposal) => {
              const freelancer = proposal.freelancer || {};
              const freelancerLabel =
                freelancer.name || freelancer.email || "Freelancer";

              return (
                <div
                  key={proposal._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-3)",
                      alignItems: "center",
                    }}
                  >
                    <Avatar person={freelancer} fallback={freelancerLabel} />
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {freelancerLabel}
                      </div>
                      <div
                        className="text-light"
                        style={{ fontSize: "var(--text-sm)" }}
                      >
                        NPR {Number(proposal.amount || 0).toLocaleString()} in{" "}
                        {proposal.deliveryDays || 0} days
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-2)",
                          flexWrap: "wrap",
                          marginTop: "var(--space-1)",
                        }}
                      >
                        {freelancer.verificationStatus === "verified" ? (
                          <span className="badge badge-success">Verified</span>
                        ) : null}
                        {Number(freelancer.reviewSummary?.totalReviews || 0) >
                        0 ? (
                          <span className="badge">
                            {freelancer.reviewSummary.averageRating}/5
                          </span>
                        ) : null}
                        {proposal.attachments?.length > 0 ? (
                          <span className="badge">
                            {proposal.attachments.length} attachment
                            {proposal.attachments.length === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/proposals/${proposal._id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

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
          {proposalCount > 0 || attachmentCount > 0 ? (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-light)",
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              {proposalCount > 0 ? (
                <span>{proposalCount} proposals</span>
              ) : null}
              {attachmentCount > 0 ? (
                <span>{attachmentCount} files</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Link href={`/jobs/${job._id}`} className="btn btn-ghost btn-sm">
            View Details
          </Link>

          {variant === "find" && onToggleSave ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onToggleSave(job)}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          ) : null}

          {job.activeContract ? (
            <Link
              href={`/contracts/${job.activeContract?._id || job.activeContract}`}
              className="btn btn-ghost btn-sm"
            >
              View Contract
            </Link>
          ) : null}

          {isDraft && onPostJob ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onPostJob?.(job)}
            >
              Post
            </button>
          ) : null}

          {canEdit && onEditJob ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onEditJob?.(job)}
            >
              Edit
            </button>
          ) : null}

          {canEdit && onDeleteJob ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-error)" }}
              onClick={() => onDeleteJob?.(job)}
            >
              Delete
            </button>
          ) : null}

          {variant === "find" && !isDraft ? (
            existingProposalId ? (
              <Link
                href={`/proposals/${existingProposalId}`}
                className="btn btn-primary btn-sm"
              >
                Edit Proposal
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onSubmitProposal?.(job)}
              >
                Apply Now
              </button>
            )
          ) : null}
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
  const creatorReviewSummary = job?.creatorAddress?.reviewSummary || {
    averageRating: "0.0",
    totalReviews: 0,
  };

  const getProposalStatusBadgeClass = (value) => {
    const statusLower = value?.toLowerCase();
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
          <Avatar person={job?.creatorAddress} fallback={creatorLabel} />
          <div>
            <div
              style={{
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text)",
              }}
            >
              {creatorLabel}
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
                marginTop: "var(--space-1)",
              }}
            >
              {job?.creatorAddress?.verificationStatus === "verified" ? (
                <span className="badge badge-success">Verified client</span>
              ) : null}
              {Number(creatorReviewSummary.totalReviews || 0) > 0 ? (
                <span className="badge">
                  {creatorReviewSummary.averageRating}/5
                </span>
              ) : null}
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
          {deliveryDays ? (
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
          ) : null}
          {revisionsIncluded !== undefined ? (
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
          ) : null}
        </div>
        {coverLetter ? (
          <div style={{ marginBottom: "var(--space-3)" }}>
            <p className="text-light">
              {coverLetter.length > 150
                ? `${coverLetter.slice(0, 150)}...`
                : coverLetter}
            </p>
          </div>
        ) : null}
        {status === PROPOSAL_STATUS.REJECTED && rejectionReason ? (
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
        ) : null}
        {attachments?.length > 0 ? (
          <div style={{ marginBottom: "var(--space-3)" }}>
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-light)",
                marginBottom: "var(--space-2)",
              }}
            >
              Attachments: {attachments.length} file(s)
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
              }}
            >
              {attachments.slice(0, 2).map((attachment, index) => (
                <a
                  key={attachment}
                  href={attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  File {index + 1}
                </a>
              ))}
            </div>
          </div>
        ) : null}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginLeft: "auto",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Link
            href={`/proposals/${proposal._id}`}
            className="btn btn-ghost btn-sm"
          >
            View Details
          </Link>
          {status === PROPOSAL_STATUS.REJECTED ? (
            <Link
              href={`/proposals/${proposal._id}`}
              className="btn btn-primary btn-sm"
            >
              Resubmit
            </Link>
          ) : null}
          {status === PROPOSAL_STATUS.PENDING && onWithdraw ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-error)" }}
              onClick={() => onWithdraw(proposal)}
            >
              Withdraw
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};
