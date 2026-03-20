import { CONTRACT_STATUS, MILESTONE_STATUS } from "@/shared/constants/statuses";

export function ContractWorkSection({
  allMilestonesApproved,
  canCompleteContract,
  canSubmitDelivery,
  completedMilestones,
  contract,
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
  milestoneEvidence,
  milestoneRevisionNotes,
  onDeliveryNotesChange,
  onDeliveryRevisionNotesChange,
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

                {milestone.revisionNotes ? (
                  <p className="text-sm text-muted mb-3">
                    Latest revision request: {milestone.revisionNotes}
                  </p>
                ) : null}

                {canSubmit ? (
                  <div>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Share milestone evidence or delivery notes"
                      value={milestoneEvidence[index] || ""}
                      onChange={(event) =>
                        onMilestoneEvidenceChange(index, event.target.value)
                      }
                    />
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

                {milestone.evidence ? (
                  <p className="text-secondary mb-3">{milestone.evidence}</p>
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
        {contract.deliverySubmission?.submittedAt &&
        contract.deliverySubmission?.status !== "CHANGES_REQUESTED" ? (
          <div className="card-sm">
            <p className="text-secondary mb-2">
              {contract.deliverySubmission.notes ||
                "Final work has been submitted."}
            </p>
            <p className="text-sm text-muted mb-0">
              Submitted on{" "}
              {new Date(contract.deliverySubmission.submittedAt).toLocaleString(
                "en-NP",
              )}
            </p>
            {contract.deliverySubmission?.revisionNotes ? (
              <p className="text-sm text-muted mt-2 mb-0">
                Latest revision request:{" "}
                {contract.deliverySubmission.revisionNotes}
              </p>
            ) : null}
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
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share the final delivery details for this contract"
              value={deliveryNotes}
              onChange={(event) => onDeliveryNotesChange(event.target.value)}
            />
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
