import { formatStatus } from "@/shared/utils/job";

export function JobDetailSummarySection({
  budgetDisplay,
  creatorLabel,
  deadlineText,
  job,
  locationText,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--font-weight-semibold)",
            margin: 0,
          }}
        >
          {job.title}
        </h1>
        <span
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-weight-semibold)",
            whiteSpace: "nowrap",
          }}
        >
          {budgetDisplay}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          margin: "1rem 0",
          alignItems: "center",
        }}
      >
        <span className={`status-badge status-${job.status?.toLowerCase()}`}>
          {formatStatus(job.status)}
        </span>
        {job.jobType && (
          <span
            className="badge"
            style={{
              background: "var(--color-secondary-lightest)",
              color: "var(--color-secondary)",
            }}
          >
            {job.jobType}
          </span>
        )}
        {job.category && (
          <span
            className="badge"
            style={{
              background: "var(--color-primary-lightest)",
              color: "var(--color-primary)",
            }}
          >
            {job.category}
          </span>
        )}
        {job.experienceLevel && (
          <span
            className="badge"
            style={{
              background: "var(--color-warning-lightest)",
              color: "var(--color-warning-dark)",
            }}
          >
            {job.experienceLevel}
          </span>
        )}
        {job.isUrgent && <span className="badge badge-error">Urgent</span>}
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          margin: "1rem 0",
          padding: "1rem",
          background: "rgba(0,0,0,0.03)",
          borderRadius: "4px",
          border: "1px solid var(--color-border)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {creatorLabel && (
          <span style={{ fontSize: "0.875rem" }}>
            Posted by:{" "}
            <span
              style={{
                color: "var(--color-primary)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              {creatorLabel}
            </span>
          </span>
        )}
        {locationText && (
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-light)",
            }}
          >
            Location: {locationText}
          </span>
        )}
        {deadlineText && (
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-light)",
            }}
          >
            Due: {deadlineText}
          </span>
        )}
      </div>

      {job.description && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h2
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-3)",
            }}
          >
            Description
          </h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
            {job.description}
          </p>
        </div>
      )}

      {job.requiredSkills?.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h3
            style={{
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-2)",
            }}
          >
            Required Skills
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {job.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="badge"
                style={{ background: "var(--color-border-light)" }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.tags?.length > 0 && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <h3
            style={{
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-2)",
            }}
          >
            Tags
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="badge"
                style={{ background: "var(--color-border-light)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.attachments?.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h3
            style={{
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-2)",
            }}
          >
            Job Attachments
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {job.attachments.map((attachment, index) => (
              <a
                key={attachment}
                href={attachment}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
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
