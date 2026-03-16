import { Button } from "@/shared/components/UI";
import { MILESTONE_STATUS } from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

export function JobMilestonesSection({
  canApproveMilestone,
  canSubmitMilestone,
  handleApproveMilestone,
  handleMilestoneEvidenceChange,
  handleSubmitMilestone,
  isApprovingMilestone,
  isSubmittingMilestone,
  milestoneError,
  milestoneEvidence,
  milestones,
}) {
  if (milestones.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-3)",
        }}
      >
        Milestones
      </h2>
      <ul style={{ paddingLeft: "1.25rem" }}>
        {milestones.map((milestone, index) => (
          <li
            key={`${milestone?.title || "milestone"}-${index}`}
            style={{ marginBottom: "var(--space-3)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                {milestone?.title || "Untitled"}
              </span>
              <span
                style={{
                  color: "var(--color-primary)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                NPR {Number(milestone?.value || 0).toLocaleString()}
              </span>
            </div>
            {milestone?.description && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-light)",
                  margin: "var(--space-1) 0",
                }}
              >
                {milestone.description}
              </p>
            )}
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-light)",
              }}
            >
              Status: {formatStatus(milestone?.status)}
            </span>
            {milestone?.evidence && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-light)",
                  marginTop: "var(--space-1)",
                }}
              >
                Evidence: {milestone.evidence}
              </p>
            )}
            {canSubmitMilestone &&
              milestone?.status === MILESTONE_STATUS.ACTIVE && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <label
                    htmlFor={`milestone-evidence-${index}`}
                    style={{
                      display: "block",
                      marginBottom: "var(--space-1)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    Evidence (optional)
                  </label>
                  <input
                    id={`milestone-evidence-${index}`}
                    type="text"
                    value={milestoneEvidence[index] || ""}
                    onChange={(event) =>
                      handleMilestoneEvidenceChange(index, event.target.value)
                    }
                    placeholder="Paste link or notes"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                    disabled={isSubmittingMilestone}
                  />
                  <div style={{ marginTop: "var(--space-2)" }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleSubmitMilestone(index)}
                      disabled={isSubmittingMilestone}
                    >
                      {isSubmittingMilestone ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </div>
              )}
            {canApproveMilestone &&
              milestone?.status === MILESTONE_STATUS.SUBMITTED && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleApproveMilestone(index)}
                    disabled={isApprovingMilestone}
                  >
                    {isApprovingMilestone ? "Approving..." : "Approve"}
                  </Button>
                </div>
              )}
          </li>
        ))}
      </ul>
      {milestoneError && (
        <p className="card-error" style={{ marginTop: "var(--space-3)" }}>
          {milestoneError}
        </p>
      )}
    </div>
  );
}
