"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  approveContractMilestoneAction,
  completeContractAction,
  requestContractCancellationAction,
  respondContractCancellationAction,
  signContractAction,
  submitContractMilestoneAction,
  submitContractWorkAction,
} from "@/lib/actions/contracts";
import {
  CANCELLATION_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  MILESTONE_STATUS,
} from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

export function ContractDetailPageClient({ contract, currentUserId }) {
  const [currentContract, setCurrentContract] = useState(contract);
  const [error, setError] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [milestoneEvidence, setMilestoneEvidence] = useState({});
  const [isPending, startTransition] = useTransition();

  const isFreelancer =
    String(currentContract.freelancer?._id || currentContract.freelancer) ===
    String(currentUserId);
  const isClient =
    String(currentContract.client?._id || currentContract.client) ===
    String(currentUserId);
  const isActive = currentContract.status === CONTRACT_STATUS.ACTIVE;
  const isMilestoneContract =
    currentContract.contractType === CONTRACT_TYPE.MILESTONE_BASED;
  const canSign =
    isFreelancer &&
    currentContract.status === CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE;
  const canSubmitDelivery =
    isFreelancer &&
    isActive &&
    currentContract.contractType === CONTRACT_TYPE.FULL_PROJECT &&
    !currentContract.deliverySubmission?.submittedAt;
  const canCompleteContract =
    isClient &&
    (currentContract.status === CONTRACT_STATUS.ACTIVE ||
      currentContract.status === CONTRACT_STATUS.COMPLETED);
  const cancellation = currentContract.cancellation || {
    status: CANCELLATION_STATUS.NONE,
  };
  const hasPendingCancellation =
    cancellation.status === CANCELLATION_STATUS.PENDING;
  const initiatedBy = cancellation.initiatedBy?._id || cancellation.initiatedBy;
  const isCancellationInitiator =
    initiatedBy && String(initiatedBy) === String(currentUserId);
  const canRequestCancellation =
    isActive && cancellation.status !== CANCELLATION_STATUS.PENDING;
  const canRespondCancellation =
    hasPendingCancellation && !isCancellationInitiator;

  const runAction = (work) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await work();
        setCurrentContract(result.data);
      } catch (actionError) {
        setError(actionError.message || "Something went wrong.");
      }
    });
  };

  const handleSign = () => {
    runAction(() => signContractAction(currentContract._id));
  };

  const handleSubmitMilestone = (index) => {
    runAction(() =>
      submitContractMilestoneAction(
        currentContract._id,
        index,
        milestoneEvidence[index] || "",
      ),
    );
    setMilestoneEvidence((previous) => ({ ...previous, [index]: "" }));
  };

  const handleApproveMilestone = (index) => {
    runAction(() => approveContractMilestoneAction(currentContract._id, index));
  };

  const handleSubmitDelivery = () => {
    runAction(() =>
      submitContractWorkAction(currentContract._id, deliveryNotes),
    );
    setDeliveryNotes("");
  };

  const handleCompleteContract = () => {
    runAction(() => completeContractAction(currentContract._id));
  };

  const handleRequestCancellation = () => {
    runAction(() =>
      requestContractCancellationAction(
        currentContract._id,
        cancellationReason,
      ),
    );
    setCancellationReason("");
  };

  const handleRespondCancellation = (action) => {
    runAction(() =>
      respondContractCancellationAction(currentContract._id, action),
    );
  };

  const completedMilestones = (currentContract.milestones || []).filter(
    (milestone) => milestone.status === MILESTONE_STATUS.COMPLETED,
  ).length;
  const allMilestonesApproved =
    isMilestoneContract &&
    (currentContract.milestones || []).length > 0 &&
    completedMilestones === currentContract.milestones.length;

  return (
    <div className="section section-sm">
      <div className="container max-w-3xl">
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="mb-2">{currentContract.title}</h1>
              <p className="text-muted mb-0">
                {currentContract.job?.title || "Contract"}
              </p>
            </div>
            <span className="badge badge-primary">
              {formatStatus(currentContract.status)}
            </span>
          </div>

          <div className="grid gap-4 mb-6">
            <div>
              <strong>Contract type:</strong>{" "}
              {formatStatus(currentContract.contractType)}
            </div>
            <div>
              <strong>Total amount:</strong> {currentContract.currency || "NPR"}{" "}
              {Number(currentContract.totalAmount || 0).toLocaleString()}
            </div>
            <div>
              <strong>Client signed:</strong>{" "}
              {currentContract.clientSignature?.signedAt ? "Yes" : "No"}
            </div>
            <div>
              <strong>Freelancer signed:</strong>{" "}
              {currentContract.freelancerSignature?.signedAt ? "Yes" : "No"}
            </div>
            {currentContract.completedAt ? (
              <div>
                <strong>Completed at:</strong>{" "}
                {new Date(currentContract.completedAt).toLocaleString("en-NP")}
              </div>
            ) : null}
          </div>

          {currentContract.description ? (
            <div className="mb-6">
              <h3 className="mb-2">Scope</h3>
              <p className="text-secondary mb-0">
                {currentContract.description}
              </p>
            </div>
          ) : null}

          {currentContract.terms ? (
            <div className="mb-6">
              <h3 className="mb-2">Terms</h3>
              <p className="text-secondary mb-0">{currentContract.terms}</p>
            </div>
          ) : null}

          {isMilestoneContract ? (
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="mb-0">Milestones</h3>
                <span className="text-sm text-muted">
                  {completedMilestones}/{currentContract.milestones.length}{" "}
                  approved
                </span>
              </div>
              <div className="grid gap-3">
                {currentContract.milestones.map((milestone, index) => {
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
                      <div className="flex items-center justify-between gap-4">
                        <strong>{milestone.title}</strong>
                        <span className="badge">
                          {formatStatus(milestone.status)}
                        </span>
                      </div>
                      {milestone.description ? (
                        <p className="text-secondary mt-2 mb-2">
                          {milestone.description}
                        </p>
                      ) : null}
                      <div className="text-sm text-muted">
                        NPR {Number(milestone.value || 0).toLocaleString()}
                      </div>
                      {milestone.evidence ? (
                        <p className="text-sm text-muted mt-2 mb-0">
                          Submission: {milestone.evidence}
                        </p>
                      ) : null}
                      {canSubmit ? (
                        <div style={{ marginTop: "var(--space-3)" }}>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Describe this milestone submission"
                            value={milestoneEvidence[index] || ""}
                            onChange={(event) =>
                              setMilestoneEvidence((previous) => ({
                                ...previous,
                                [index]: event.target.value,
                              }))
                            }
                          />
                          <div className="flex justify-end mt-2">
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
                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApproveMilestone(index)}
                            disabled={isPending}
                          >
                            {isPending ? "Approving..." : "Approve Milestone"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="mb-3">Full Project Delivery</h3>
              {currentContract.deliverySubmission?.submittedAt ? (
                <div className="card-sm">
                  <p className="text-secondary mb-2">
                    {currentContract.deliverySubmission.notes ||
                      "Final work has been submitted."}
                  </p>
                  <p className="text-sm text-muted mb-0">
                    Submitted on{" "}
                    {new Date(
                      currentContract.deliverySubmission.submittedAt,
                    ).toLocaleString("en-NP")}
                  </p>
                </div>
              ) : canSubmitDelivery ? (
                <div className="card-sm">
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Share the final delivery details for this contract"
                    value={deliveryNotes}
                    onChange={(event) => setDeliveryNotes(event.target.value)}
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
          )}

          <div className="mb-6">
            <h3 className="mb-3">Contract Status Actions</h3>
            {canCompleteContract &&
            currentContract.status !== CONTRACT_STATUS.COMPLETED &&
            ((isMilestoneContract && allMilestonesApproved) ||
              (!isMilestoneContract &&
                currentContract.deliverySubmission?.submittedAt)) ? (
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
                {currentContract.status === CONTRACT_STATUS.COMPLETED
                  ? "This contract is complete."
                  : "Completion becomes available after all deliverables are submitted and reviewed."}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="mb-3">Cancellation</h3>
            <div className="card-sm">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="badge">
                  {formatStatus(
                    cancellation.status || CANCELLATION_STATUS.NONE,
                  )}
                </span>
                {cancellation.initiatedRole ? (
                  <span className="text-sm text-muted">
                    Initiated by {cancellation.initiatedRole.toLowerCase()}
                  </span>
                ) : null}
              </div>
              {cancellation.reason ? (
                <p className="text-secondary mb-3">{cancellation.reason}</p>
              ) : null}
              {canRequestCancellation ? (
                <>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Explain why you want to cancel this contract"
                    value={cancellationReason}
                    onChange={(event) =>
                      setCancellationReason(event.target.value)
                    }
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleRequestCancellation}
                      disabled={isPending}
                    >
                      {isPending ? "Requesting..." : "Request Cancellation"}
                    </button>
                  </div>
                </>
              ) : null}
              {canRespondCancellation ? (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRespondCancellation("accept")}
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRespondCancellation("reject")}
                    disabled={isPending}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
              {hasPendingCancellation && isCancellationInitiator ? (
                <p className="text-muted mt-3 mb-0">
                  Waiting for the other party to respond to your cancellation
                  request.
                </p>
              ) : null}
            </div>
          </div>

          {error ? <div className="card-error mb-4">{error}</div> : null}

          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/jobs/${currentContract.job?._id || ""}`}
              className="btn btn-ghost"
            >
              View Job
            </Link>
            {canSign ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSign}
                disabled={isPending}
              >
                {isPending ? "Signing..." : "Sign Contract"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
