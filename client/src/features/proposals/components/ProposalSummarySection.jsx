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
              {(proposal.freelancer.name || proposal.freelancer.email || "U")
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
                Attachment {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
