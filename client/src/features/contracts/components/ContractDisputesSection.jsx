import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { formatStatus } from "@/shared/utils/job";
import { formatContractDateTime } from "./contractDetailUtils";

function AttachmentLinks({ attachments, label }) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <div style={{ marginTop: "var(--space-2)" }}>
      {label ? <p className="text-sm text-muted mb-2">{label}</p> : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        {attachments.map((attachment, index) => (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
          >
            {attachment.name || `Attachment ${index + 1}`}
          </a>
        ))}
      </div>
    </div>
  );
}

export function ContractDisputesSection({
  activeDispute,
  canOpenDispute,
  contract,
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
  const latestDelivery = contract.deliverySubmission?.submissionHistory?.at(-1);
  const latestRevisions = contract.deliverySubmission?.revisionHistory || [];
  const milestoneSubmissions = (contract.milestones || []).flatMap(
    (milestone, milestoneIndex) =>
      (milestone.submissionHistory || []).map(
        (submission, submissionIndex) => ({
          key: `${milestone._id || milestoneIndex}-${submission._id || submissionIndex}`,
          title: milestone.title || `Milestone ${milestoneIndex + 1}`,
          ...submission,
        }),
      ),
  );

  return (
    <div className="mb-6">
      <h3 className="mb-3">Disputes</h3>

      <div className="card-sm mb-4">
        <h4 className="mb-2">Dispute Context</h4>
        <div className="grid gap-3">
          <div>
            <strong>Job Details</strong>
            <p className="text-secondary mb-1">
              {contract.job?.description || "No job description available."}
            </p>
            <p className="text-sm text-muted mb-0">
              {contract.job?.category || "General"}{" "}
              {contract.job?.subcategory ? `· ${contract.job.subcategory}` : ""}
            </p>
          </div>
          <div>
            <strong>Contract Terms</strong>
            <p className="text-secondary mb-0">
              {contract.terms || "No contract terms were added."}
            </p>
          </div>
          <div>
            <strong>Latest Submitted Work</strong>
            <p className="text-secondary mb-1">
              {latestDelivery?.notes || "No final work submission yet."}
            </p>
            <AttachmentLinks
              attachments={latestDelivery?.attachments}
              label="Submitted files"
            />
          </div>
          {milestoneSubmissions.length ? (
            <div>
              <strong>Submitted Milestone Work</strong>
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-2)",
                }}
              >
                {milestoneSubmissions.map((submission) => (
                  <div key={submission.key} className="card-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <span>{submission.title}</span>
                      <span className="text-sm text-muted">
                        {formatContractDateTime(submission.submittedAt)}
                      </span>
                    </div>
                    {submission.notes ? (
                      <p className="text-secondary mb-2">{submission.notes}</p>
                    ) : null}
                    <AttachmentLinks attachments={submission.attachments} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <strong>Revision History</strong>
            {latestRevisions.length ? (
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-2)",
                }}
              >
                {latestRevisions.map((revision, index) => (
                  <div key={revision._id || index} className="card-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <span>Revision Request {index + 1}</span>
                      <span className="text-sm text-muted">
                        {formatContractDateTime(revision.requestedAt)}
                      </span>
                    </div>
                    <p className="text-secondary mb-0">
                      {revision.notes ||
                        "Changes were requested for the submitted work."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted mb-0">
                No revision requests yet.
              </p>
            )}
          </div>
        </div>
      </div>

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
              <AttachmentLinks
                attachments={dispute.evidenceAttachments}
                label="Evidence"
              />
              {dispute.resolutionNotes ? (
                <p
                  className="text-secondary mb-0"
                  style={{ marginTop: "var(--space-2)" }}
                >
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
