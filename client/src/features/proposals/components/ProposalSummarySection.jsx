import Link from "next/link";
import { RemoteAvatar } from "@/shared/components/RemoteAvatar";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

const getStatusBadgeClass = (status) => {
  const statusLower = status?.toLowerCase();
  if (statusLower === PROPOSAL_STATUS.ACCEPTED) return "badge-success";
  if (statusLower === PROPOSAL_STATUS.PENDING) return "badge-warning";
  if (statusLower === PROPOSAL_STATUS.REJECTED) return "badge-error";
  return "";
};

export function ProposalSummarySection({ proposal }) {
  return (
    <>
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
            {proposal.pricingType === "inspection_required"
              ? "Inspection required"
              : `NPR ${proposal.amount?.toLocaleString()}`}
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

      {proposal.freelancer ? (
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
            <RemoteAvatar
              src={proposal.freelancer.avatar}
              alt={proposal.freelancer.name || "Freelancer"}
              fallback={
                proposal.freelancer.name || proposal.freelancer.email || "U"
              }
              size={40}
              textSize="var(--text-base)"
            />
            <div>
              <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                {proposal.freelancer.name || "Unknown"}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                  marginTop: "var(--space-1)",
                }}
              >
                {proposal.freelancer.verificationStatus === "verified" ? (
                  <span className="badge badge-success">Verified</span>
                ) : null}
                {Number(proposal.freelancer.reviewSummary?.totalReviews || 0) >
                0 ? (
                  <span className="badge">
                    {proposal.freelancer.reviewSummary.averageRating}/5 ·{" "}
                    {proposal.freelancer.reviewSummary.totalReviews} review
                    {Number(proposal.freelancer.reviewSummary.totalReviews) ===
                    1
                      ? ""
                      : "s"}
                  </span>
                ) : null}
              </div>
              {proposal.freelancer.email ? (
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                  }}
                >
                  {proposal.freelancer.email}
                </div>
              ) : null}
              {proposal.freelancer._id ? (
                <Link
                  href={`/freelancers/${proposal.freelancer._id}`}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: "var(--space-2)" }}
                >
                  View Freelancer
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {proposal.coverLetter ? (
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
      ) : null}

      {proposal.visitAvailableOn || proposal.inspectionNotes ? (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-light)",
              marginBottom: "var(--space-2)",
            }}
          >
            Physical Work Notes
          </div>
          <div
            style={{
              background: "var(--color-bg-secondary)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius)",
            }}
          >
            {proposal.visitAvailableOn ? (
              <p style={{ marginBottom: "var(--space-2)" }}>
                <strong>Visit available on:</strong>{" "}
                {new Date(proposal.visitAvailableOn).toLocaleDateString("en-NP")}
              </p>
            ) : null}
            {proposal.inspectionNotes ? (
              <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0 }}>
                {proposal.inspectionNotes}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {proposal.rejectionReason ? (
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
      ) : null}

      {proposal.attachments?.length > 0 ? (
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
                key={attachment || `attachment-${index + 1}`}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{
                  justifyContent: "flex-start",
                  textDecoration: "none",
                }}
              >
                Attachment {index + 1}
              </a>
            ))}
          </div>
          <p className="text-light" style={{ marginTop: "var(--space-2)" }}>
            {proposal.attachments.length} attachment
            {proposal.attachments.length === 1 ? "" : "s"} included with this
            proposal.
          </p>
        </div>
      ) : null}
    </>
  );
}
