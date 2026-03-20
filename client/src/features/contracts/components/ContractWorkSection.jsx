import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { CONTRACT_STATUS, MILESTONE_STATUS } from "@/shared/constants/statuses";
import { formatContractDateTime } from "./contractDetailUtils";

function AttachmentLinks({ attachments, emptyLabel = null }) {
  if (!attachments?.length) {
    return emptyLabel ? (
      <p className="text-sm text-muted mb-0">{emptyLabel}</p>
    ) : null;
  }

  return (
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
  );
}

function SubmissionHistory({ submissions, emptyLabel }) {
  if (!submissions?.length) {
    return <p className="text-sm text-muted mb-0">{emptyLabel}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-2)" }}>
      {submissions.map((submission, index) => (
        <div key={submission._id || index} className="card-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <strong>Submission {index + 1}</strong>
            <span className="text-sm text-muted">
              {formatContractDateTime(submission.submittedAt)}
            </span>
          </div>
          {submission.notes ? (
            <p className="text-secondary mb-3">{submission.notes}</p>
          ) : null}
          <AttachmentLinks
            attachments={submission.attachments}
            emptyLabel="No attachments were added to this submission."
          />
        </div>
      ))}
    </div>
  );
}

function RevisionHistory({ revisions, emptyLabel }) {
  if (!revisions?.length) {
    return <p className="text-sm text-muted mb-0">{emptyLabel}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-2)" }}>
      {revisions.map((revision, index) => (
        <div key={revision._id || index} className="card-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <strong>Revision Request {index + 1}</strong>
            <span className="text-sm text-muted">
              {formatContractDateTime(revision.requestedAt)}
            </span>
          </div>
          <p className="text-secondary mb-0">
            {revision.notes ||
              "The client requested updates to the submitted work."}
          </p>
        </div>
      ))}
    </div>
  );
}

function UploadRecommendation() {
  return (
    <p className="text-sm text-muted mb-3">
      Recommendation: Videos and other heavy files should be shared through
      Google Drive or another cloud link, then included in your submission
      notes.
    </p>
  );
}

export function ContractWorkSection({
  allMilestonesApproved,
  canCompleteContract,
  canSubmitDelivery,
  completedMilestones,
  contract,
  deliveryAttachments,
  deliveryNotes,
  deliveryRevisionNotes,
  handleApproveMilestone,
  handleCompleteContract,
  handleRequestDeliveryChanges,
  handleRequestMilestoneChanges,
  handleSubmitDelivery,
  handleSubmitMilestone,
  isActive,
  isClient,
  isFreelancer,
  isMilestoneContract,
  isPending,
  milestoneAttachments,
  milestoneEvidence,
  milestoneRevisionNotes,
  onDeliveryAttachmentRemove,
  onDeliveryAttachmentUploaded,
  onDeliveryNotesChange,
  onDeliveryRevisionNotesChange,
  onMilestoneAttachmentRemove,
  onMilestoneAttachmentUploaded,
  onMilestoneEvidenceChange,
  onMilestoneRevisionNotesChange,
}) {
  return isMilestoneContract ? (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="mb-0">Milestones</h3>
          <span className="text-sm text-muted">
            {completedMilestones}/{contract.milestones.length} approved
          </span>
        </div>
        <div className="grid gap-3">
          {contract.milestones.map((milestone, index) => {
            const canSubmit =
              isFreelancer &&
              isActive &&
              milestone.status === MILESTONE_STATUS.ACTIVE;
            const canApprove =
              isClient &&
              isActive &&
              milestone.status === MILESTONE_STATUS.SUBMITTED;

            return (
              <div key={milestone._id || index} className="card-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <strong>
                      {milestone.title || `Milestone ${index + 1}`}
                    </strong>
                    <div className="text-sm text-muted">
                      NPR {Number(milestone.value || 0).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge">{milestone.status}</span>
                </div>

                {milestone.description ? (
                  <p className="text-secondary">{milestone.description}</p>
                ) : null}

                <div className="mb-3">
                  <h4 className="mb-2">Submission History</h4>
                  <SubmissionHistory
                    submissions={milestone.submissionHistory}
                    emptyLabel="No milestone submissions yet."
                  />
                </div>

                <div className="mb-3">
                  <h4 className="mb-2">Revision History</h4>
                  <RevisionHistory
                    revisions={milestone.revisionHistory}
                    emptyLabel="No revision requests yet."
                  />
                </div>

                {canSubmit ? (
                  <div>
                    <UploadRecommendation />
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Share milestone delivery notes"
                      value={milestoneEvidence[index] || ""}
                      onChange={(event) =>
                        onMilestoneEvidenceChange(index, event.target.value)
                      }
                    />
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <CloudinaryFileUploader
                        folder="neplance/contracts/milestones"
                        buttonLabel="Upload Milestone Attachment"
                        onUploaded={(upload) =>
                          onMilestoneAttachmentUploaded(index, upload)
                        }
                      />
                      <AttachmentLinks
                        attachments={milestoneAttachments[index] || []}
                        emptyLabel="No attachments selected yet."
                      />
                      {(milestoneAttachments[index] || []).length ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(milestoneAttachments[index] || []).map(
                            (attachment, attachmentIndex) => (
                              <button
                                key={`${attachment.url}-${attachmentIndex}`}
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  onMilestoneAttachmentRemove(
                                    index,
                                    attachmentIndex,
                                  )
                                }
                              >
                                Remove{" "}
                                {attachment.name ||
                                  `File ${attachmentIndex + 1}`}
                              </button>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSubmitMilestone(index)}
                        disabled={isPending}
                      >
                        {isPending ? "Submitting..." : "Submit Milestone"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {canApprove ? (
                  <>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproveMilestone(index)}
                        disabled={isPending}
                      >
                        {isPending ? "Approving..." : "Approve Milestone"}
                      </button>
                    </div>
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Explain the changes you want in this milestone"
                        value={milestoneRevisionNotes[index] || ""}
                        onChange={(event) =>
                          onMilestoneRevisionNotesChange(
                            index,
                            event.target.value,
                          )
                        }
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRequestMilestoneChanges(index)}
                          disabled={isPending}
                        >
                          {isPending ? "Requesting..." : "Request Changes"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3">Contract Status Actions</h3>
        {canCompleteContract &&
        contract.status !== CONTRACT_STATUS.COMPLETED &&
        allMilestonesApproved ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCompleteContract}
            disabled={isPending}
          >
            {isPending ? "Completing..." : "Complete Contract"}
          </button>
        ) : (
          <p className="text-muted mb-0">
            {contract.status === CONTRACT_STATUS.COMPLETED
              ? "This contract is complete."
              : "Completion becomes available after all deliverables are submitted and reviewed."}
          </p>
        )}
      </div>
    </>
  ) : (
    <>
      <div className="mb-6">
        <h3 className="mb-3">Full Project Delivery</h3>
        <div className="card-sm mb-3">
          <h4 className="mb-2">Submission History</h4>
          <SubmissionHistory
            submissions={contract.deliverySubmission?.submissionHistory}
            emptyLabel="Final work has not been submitted yet."
          />
        </div>

        <div className="card-sm mb-3">
          <h4 className="mb-2">Revision History</h4>
          <RevisionHistory
            revisions={contract.deliverySubmission?.revisionHistory}
            emptyLabel="No revision requests yet."
          />
        </div>

        {contract.deliverySubmission?.submittedAt &&
        contract.deliverySubmission?.status !== "CHANGES_REQUESTED" ? (
          <div className="card-sm">
            <p className="text-secondary mb-2">
              {contract.deliverySubmission.notes ||
                "Final work has been submitted."}
            </p>
            <p className="text-sm text-muted mb-3">
              Submitted on{" "}
              {formatContractDateTime(contract.deliverySubmission.submittedAt)}
            </p>
            <AttachmentLinks
              attachments={contract.deliverySubmission.attachments}
              emptyLabel="No attachments were added to the latest delivery."
            />
            {isClient &&
            isActive &&
            contract.status !== CONTRACT_STATUS.COMPLETED ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Explain the changes you want in the final delivery"
                  value={deliveryRevisionNotes}
                  onChange={(event) =>
                    onDeliveryRevisionNotesChange(event.target.value)
                  }
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleRequestDeliveryChanges}
                    disabled={isPending}
                  >
                    {isPending ? "Requesting..." : "Request Changes"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : canSubmitDelivery ? (
          <div className="card-sm">
            <UploadRecommendation />
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share the final delivery details for this contract"
              value={deliveryNotes}
              onChange={(event) => onDeliveryNotesChange(event.target.value)}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              <CloudinaryFileUploader
                folder="neplance/contracts/deliveries"
                buttonLabel="Upload Work Attachment"
                onUploaded={onDeliveryAttachmentUploaded}
              />
              <AttachmentLinks
                attachments={deliveryAttachments}
                emptyLabel="No attachments selected yet."
              />
              {deliveryAttachments.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryAttachments.map((attachment, index) => (
                    <button
                      key={`${attachment.url}-${index}`}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onDeliveryAttachmentRemove(index)}
                    >
                      Remove {attachment.name || `File ${index + 1}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSubmitDelivery}
                disabled={isPending}
              >
                {isPending ? "Submitting..." : "Submit Final Work"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted mb-0">
            Final work has not been submitted yet.
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3">Contract Status Actions</h3>
        {canCompleteContract &&
        contract.status !== CONTRACT_STATUS.COMPLETED &&
        contract.deliverySubmission?.submittedAt ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCompleteContract}
            disabled={isPending}
          >
            {isPending ? "Completing..." : "Complete Contract"}
          </button>
        ) : (
          <p className="text-muted mb-0">
            {contract.status === CONTRACT_STATUS.COMPLETED
              ? "This contract is complete."
              : "Completion becomes available after all deliverables are submitted and reviewed."}
          </p>
        )}
      </div>
    </>
  );
}
