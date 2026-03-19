"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  approveContractMilestoneAction,
  completeContractAction,
  createContractDisputeAction,
  requestContractCancellationAction,
  requestContractDeliveryChangesAction,
  requestContractMilestoneChangesAction,
  respondContractCancellationAction,
  signContractAction,
  submitContractMilestoneAction,
  submitContractReviewAction,
  submitContractWorkAction,
} from "@/lib/actions/contracts";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import {
  CANCELLATION_STATUS,
  CONTRACT_FUNDING_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  DISPUTE_STATUS,
  MILESTONE_STATUS,
} from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

const formatDateTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleString("en-NP");
};

const getTimelineEvents = (contract) => {
  const events = [];

  events.push({
    key: "contract-created",
    title: "Contract created",
    description: "The client created the contract from the selected proposal.",
    at: contract.createdAt,
  });

  if (contract.clientSignature?.signedAt) {
    events.push({
      key: "client-signed",
      title: "Client signed",
      description: "The client confirmed the contract terms.",
      at: contract.clientSignature.signedAt,
    });
  }

  if (contract.fundedAt) {
    events.push({
      key: "contract-funded",
      title: "Contract funded",
      description: "The client reserved the required funds for this contract.",
      at: contract.fundedAt,
    });
  }

  if (contract.freelancerSignature?.signedAt) {
    events.push({
      key: "freelancer-signed",
      title: "Freelancer signed",
      description: "The freelancer signed and activated the contract.",
      at: contract.freelancerSignature.signedAt,
    });
  }

  (contract.milestones || []).forEach((milestone, index) => {
    if (milestone.completedAt) {
      events.push({
        key: `milestone-submitted-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} submitted`,
        description:
          milestone.evidence || "The freelancer submitted this milestone.",
        at: milestone.completedAt,
      });
    }

    if (milestone.approvedAt) {
      events.push({
        key: `milestone-approved-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} approved`,
        description: "The client approved this milestone.",
        at: milestone.approvedAt,
      });
    }

    if (milestone.revisionRequestedAt) {
      events.push({
        key: `milestone-revision-${index}`,
        title: `${milestone.title || `Milestone ${index + 1}`} changes requested`,
        description:
          milestone.revisionNotes || "The client requested milestone changes.",
        at: milestone.revisionRequestedAt,
      });
    }
  });

  if (contract.deliverySubmission?.submittedAt) {
    events.push({
      key: "delivery-submitted",
      title: "Final delivery submitted",
      description:
        contract.deliverySubmission.notes ||
        "The freelancer submitted the final project work.",
      at: contract.deliverySubmission.submittedAt,
    });
  }

  if (contract.deliverySubmission?.revisionRequestedAt) {
    events.push({
      key: "delivery-revision-requested",
      title: "Final delivery changes requested",
      description:
        contract.deliverySubmission.revisionNotes ||
        "The client requested changes to the final delivery.",
      at: contract.deliverySubmission.revisionRequestedAt,
    });
  }

  if (contract.cancellation?.requestedAt) {
    events.push({
      key: "cancellation-requested",
      title: "Cancellation requested",
      description:
        contract.cancellation.reason ||
        "A cancellation request was submitted for this contract.",
      at: contract.cancellation.requestedAt,
    });
  }

  if (contract.cancellation?.respondedAt) {
    events.push({
      key: "cancellation-responded",
      title:
        contract.cancellation.status === CANCELLATION_STATUS.ACCEPTED
          ? "Cancellation accepted"
          : "Cancellation rejected",
      description: "The other party responded to the cancellation request.",
      at: contract.cancellation.respondedAt,
    });
  }

  if (contract.completedAt) {
    events.push({
      key: "contract-completed",
      title: "Contract completed",
      description: "All deliverables were accepted and the contract closed.",
      at: contract.completedAt,
    });
  }

  (contract.disputes || []).forEach((dispute, index) => {
    if (dispute.createdAt) {
      events.push({
        key: `dispute-opened-${dispute._id || index}`,
        title: "Dispute opened",
        description:
          dispute.reason || "A dispute was opened for this contract.",
        at: dispute.createdAt,
      });
    }

    if (dispute.resolvedAt) {
      events.push({
        key: `dispute-closed-${dispute._id || index}`,
        title:
          dispute.status === DISPUTE_STATUS.RESOLVED
            ? "Dispute resolved"
            : "Dispute closed",
        description:
          dispute.resolutionNotes ||
          "An admin reviewed and closed this dispute.",
        at: dispute.resolvedAt,
      });
    }
  });

  return events
    .filter((event) => event.at)
    .sort((left, right) => new Date(left.at) - new Date(right.at));
};

export function ContractDetailPageClient({ contract, currentUserId }) {
  const [currentContract, setCurrentContract] = useState(contract);
  const [error, setError] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [milestoneEvidence, setMilestoneEvidence] = useState({});
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [deliveryRevisionNotes, setDeliveryRevisionNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeEvidenceAttachments, setDisputeEvidenceAttachments] = useState(
    [],
  );
  const [milestoneRevisionNotes, setMilestoneRevisionNotes] = useState({});
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
    (!currentContract.deliverySubmission?.submittedAt ||
      currentContract.deliverySubmission?.status === "CHANGES_REQUESTED");
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
  const disputes = Array.isArray(currentContract.disputes)
    ? currentContract.disputes
    : [];
  const activeDispute = disputes.find((dispute) =>
    [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.UNDER_REVIEW].includes(dispute.status),
  );
  const canOpenDispute =
    !activeDispute &&
    [
      CONTRACT_STATUS.ACTIVE,
      CONTRACT_STATUS.COMPLETED,
      CONTRACT_STATUS.CANCELLED,
    ].includes(currentContract.status);

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

  const handleSubmitReview = () => {
    runAction(() =>
      submitContractReviewAction(currentContract._id, {
        rating: reviewRating,
        comment: reviewComment,
      }),
    );
    setReviewComment("");
    setReviewRating("5");
  };

  const handleRequestMilestoneChanges = (index) => {
    runAction(() =>
      requestContractMilestoneChangesAction(
        currentContract._id,
        index,
        milestoneRevisionNotes[index] || "",
      ),
    );
    setMilestoneRevisionNotes((previous) => ({ ...previous, [index]: "" }));
  };

  const handleRequestDeliveryChanges = () => {
    runAction(() =>
      requestContractDeliveryChangesAction(
        currentContract._id,
        deliveryRevisionNotes,
      ),
    );
    setDeliveryRevisionNotes("");
  };

  const handleOpenDispute = () => {
    runAction(() =>
      createContractDisputeAction(currentContract._id, {
        reason: disputeReason,
        description: disputeDescription,
        evidenceAttachments: disputeEvidenceAttachments,
      }),
    );
    setDisputeReason("");
    setDisputeDescription("");
    setDisputeEvidenceAttachments([]);
  };

  const completedMilestones = (currentContract.milestones || []).filter(
    (milestone) => milestone.status === MILESTONE_STATUS.COMPLETED,
  ).length;
  const allMilestonesApproved =
    isMilestoneContract &&
    (currentContract.milestones || []).length > 0 &&
    completedMilestones === currentContract.milestones.length;
  const timelineEvents = getTimelineEvents(currentContract);
  const reviews = Array.isArray(currentContract.reviews)
    ? currentContract.reviews
    : [];
  const existingReview = reviews.find(
    (review) =>
      String(review.reviewer?._id || review.reviewer) === String(currentUserId),
  );
  const canReview =
    currentContract.status === CONTRACT_STATUS.COMPLETED && !existingReview;
  const remainingFundedBalance = Math.max(
    Number(currentContract.fundedAmount || 0) -
      Number(currentContract.releasedAmount || 0) -
      Number(currentContract.refundedAmount || 0),
    0,
  );

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
              <strong>Total contract value:</strong>{" "}
              {currentContract.currency || "NPR"}{" "}
              {Number(currentContract.totalAmount || 0).toLocaleString()}
            </div>
            <div>
              <strong>Funding status:</strong>{" "}
              {formatStatus(
                currentContract.fundingStatus ||
                  CONTRACT_FUNDING_STATUS.UNFUNDED,
              )}
            </div>
            <div>
              <strong>Funded amount:</strong>{" "}
              {currentContract.currency || "NPR"}{" "}
              {Number(currentContract.fundedAmount || 0).toLocaleString()}
            </div>
            <div>
              <strong>Released amount:</strong>{" "}
              {currentContract.currency || "NPR"}{" "}
              {Number(currentContract.releasedAmount || 0).toLocaleString()}
            </div>
            <div>
              <strong>Refunded amount:</strong>{" "}
              {currentContract.currency || "NPR"}{" "}
              {Number(currentContract.refundedAmount || 0).toLocaleString()}
            </div>
            <div>
              <strong>Still held:</strong> {currentContract.currency || "NPR"}{" "}
              {Number(remainingFundedBalance || 0).toLocaleString()}
            </div>
            {currentContract.job?.budget ? (
              <div>
                <strong>Original job budget:</strong>{" "}
                {currentContract.job.budget.currency || "NPR"}{" "}
                {Number(currentContract.job.budget.min || 0).toLocaleString()}
                {currentContract.job.budget.max
                  ? ` - ${currentContract.job.budget.currency || "NPR"} ${Number(currentContract.job.budget.max).toLocaleString()}`
                  : ""}
              </div>
            ) : null}
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

          {currentContract.job?.attachments?.length > 0 ? (
            <div className="mb-6">
              <h3 className="mb-3">Job Attachments</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                {currentContract.job.attachments.map((attachment, index) => (
                  <a
                    key={attachment}
                    href={attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    Job File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {currentContract.proposal?.attachments?.length > 0 ? (
            <div className="mb-6">
              <h3 className="mb-3">Proposal Attachments</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                {currentContract.proposal.attachments.map(
                  (attachment, index) => (
                    <a
                      key={attachment}
                      href={attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Proposal File {index + 1}
                    </a>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {timelineEvents.length > 0 ? (
            <div className="mb-6">
              <h3 className="mb-3">Activity Timeline</h3>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                {timelineEvents.map((event) => (
                  <div key={event.key} className="card-sm">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "var(--space-3)",
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <strong>{event.title}</strong>
                      <span className="text-sm text-muted">
                        {formatDateTime(event.at)}
                      </span>
                    </div>
                    <p className="text-secondary mb-0">{event.description}</p>
                  </div>
                ))}
              </div>
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
                  const canRequestChanges = canApprove;

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
                      {milestone.revisionNotes ? (
                        <p className="text-sm text-muted mt-2 mb-0">
                          Latest revision request: {milestone.revisionNotes}
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
                      {canRequestChanges ? (
                        <div style={{ marginTop: "var(--space-3)" }}>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Explain the changes you want in this milestone"
                            value={milestoneRevisionNotes[index] || ""}
                            onChange={(event) =>
                              setMilestoneRevisionNotes((previous) => ({
                                ...previous,
                                [index]: event.target.value,
                              }))
                            }
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                handleRequestMilestoneChanges(index)
                              }
                              disabled={isPending}
                            >
                              {isPending ? "Requesting..." : "Request Changes"}
                            </button>
                          </div>
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
              {currentContract.deliverySubmission?.submittedAt &&
              currentContract.deliverySubmission?.status !==
                "CHANGES_REQUESTED" ? (
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
                  {currentContract.deliverySubmission?.revisionNotes ? (
                    <p className="text-sm text-muted mt-2 mb-0">
                      Latest revision request:{" "}
                      {currentContract.deliverySubmission.revisionNotes}
                    </p>
                  ) : null}
                  {isClient &&
                  isActive &&
                  currentContract.status !== CONTRACT_STATUS.COMPLETED ? (
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Explain the changes you want in the final delivery"
                        value={deliveryRevisionNotes}
                        onChange={(event) =>
                          setDeliveryRevisionNotes(event.target.value)
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
            <h3 className="mb-3">Reviews</h3>
            {reviews.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                {reviews.map((review) => (
                  <div key={review._id} className="card-sm">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        flexWrap: "wrap",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div>
                        <strong>{review.reviewer?.name || "Reviewer"}</strong>
                        <div className="text-sm text-muted">
                          {formatDateTime(review.createdAt)}
                        </div>
                      </div>
                      <span className="badge badge-primary">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="text-secondary mb-0">
                      {review.comment || "No written feedback provided."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted mb-0">
                No reviews have been submitted for this contract yet.
              </p>
            )}
          </div>

          {canReview ? (
            <div className="mb-6">
              <h3 className="mb-3">Leave a Review</h3>
              <div className="card-sm">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="contract-review-rating"
                  >
                    Rating
                  </label>
                  <select
                    id="contract-review-rating"
                    className="form-input"
                    value={reviewRating}
                    onChange={(event) => setReviewRating(event.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={String(value)}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="contract-review-comment"
                  >
                    Comment
                  </label>
                  <textarea
                    id="contract-review-comment"
                    className="form-input"
                    rows={4}
                    maxLength={2000}
                    placeholder="Share your experience working on this contract"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmitReview}
                    disabled={isPending}
                  >
                    {isPending ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
                          Opened {formatDateTime(dispute.createdAt)}
                        </div>
                      </div>
                      <span className="badge">
                        {formatStatus(dispute.status)}
                      </span>
                    </div>
                    {dispute.description ? (
                      <p className="text-secondary mb-2">
                        {dispute.description}
                      </p>
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
                        {dispute.evidenceAttachments.map(
                          (attachment, index) => (
                            <a
                              key={`${attachment.url}-${index}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                            >
                              Evidence {index + 1}
                            </a>
                          ),
                        )}
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
                  <label
                    className="form-label"
                    htmlFor="contract-dispute-reason"
                  >
                    Dispute reason
                  </label>
                  <input
                    id="contract-dispute-reason"
                    className="form-input"
                    type="text"
                    maxLength={300}
                    placeholder="Summarize the issue"
                    value={disputeReason}
                    onChange={(event) => setDisputeReason(event.target.value)}
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
                      setDisputeDescription(event.target.value)
                    }
                  />
                </div>
                <CloudinaryFileUploader
                  folder="neplance/disputes"
                  buttonLabel="Upload Evidence"
                  onUploaded={(upload) =>
                    setDisputeEvidenceAttachments((previous) => [
                      ...previous,
                      upload,
                    ])
                  }
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
                        <span>
                          {attachment.name || `Evidence ${index + 1}`}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setDisputeEvidenceAttachments((previous) =>
                              previous.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
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
