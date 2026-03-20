import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { formatStatus } from "@/shared/utils/job";
import { formatContractDateTime } from "./contractDetailUtils";

export function ContractDisputesSection({
  activeDispute,
  canOpenDispute,
  disputeDescription,
  disputeEvidenceAttachments,
  disputeReason,
  disputes,
  handleOpenDispute,
  isPending,
  onDisputeDescriptionChange,
  onDisputeEvidenceRemove,
  onDisputeEvidenceUploaded,
  onDisputeReasonChange,
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-3">Disputes</h3>
      {disputes.length ? (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {disputes.map((dispute) => (
            <div key={dispute._id} className="card-sm">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  marginBottom: "var(--space-2)",
                }}
              >
                <div>
                  <strong>{dispute.reason}</strong>
                  <div className="text-sm text-muted">
                    Opened {formatContractDateTime(dispute.createdAt)}
                  </div>
                </div>
                <span className="badge">{formatStatus(dispute.status)}</span>
              </div>
              {dispute.description ? (
                <p className="text-secondary mb-2">{dispute.description}</p>
              ) : null}
              {dispute.evidenceAttachments?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {dispute.evidenceAttachments.map((attachment, index) => (
                    <a
                      key={`${attachment.url}-${index}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Evidence {index + 1}
                    </a>
                  ))}
                </div>
              ) : null}
              {dispute.resolutionNotes ? (
                <p className="text-secondary mb-0">
                  <strong>Resolution:</strong> {dispute.resolutionNotes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted mb-3">
          No disputes have been opened for this contract.
        </p>
      )}

      {canOpenDispute ? (
        <div className="card-sm" style={{ marginTop: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="contract-dispute-reason">
              Dispute reason
            </label>
            <input
              id="contract-dispute-reason"
              className="form-input"
              type="text"
              maxLength={300}
              placeholder="Summarize the issue"
              value={disputeReason}
              onChange={(event) => onDisputeReasonChange(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="contract-dispute-description"
            >
              Details
            </label>
            <textarea
              id="contract-dispute-description"
              className="form-input"
              rows={4}
              placeholder="Explain the issue and what outcome you expect"
              value={disputeDescription}
              onChange={(event) =>
                onDisputeDescriptionChange(event.target.value)
              }
            />
          </div>
          <CloudinaryFileUploader
            folder="neplance/disputes"
            buttonLabel="Upload Evidence"
            onUploaded={onDisputeEvidenceUploaded}
          />
          {disputeEvidenceAttachments.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              {disputeEvidenceAttachments.map((attachment, index) => (
                <div
                  key={`${attachment.url}-${index}`}
                  className="badge"
                  style={{
                    display: "inline-flex",
                    gap: "var(--space-2)",
                  }}
                >
                  <span>{attachment.name || `Evidence ${index + 1}`}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onDisputeEvidenceRemove(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenDispute}
              disabled={isPending}
            >
              {isPending ? "Opening..." : "Open Dispute"}
            </button>
          </div>
        </div>
      ) : activeDispute ? (
        <p className="text-muted mt-3 mb-0">
          An open dispute already exists for this contract.
        </p>
      ) : null}
    </div>
  );
}
