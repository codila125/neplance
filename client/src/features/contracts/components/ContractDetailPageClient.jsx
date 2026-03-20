"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveContractMilestoneAction,
  cancelPendingContractAction,
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
import {
  CANCELLATION_STATUS,
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  DISPUTE_STATUS,
  MILESTONE_STATUS,
} from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";
import { ContractAttachmentsTimelineSection } from "./ContractAttachmentsTimelineSection";
import { ContractCancellationSection } from "./ContractCancellationSection";
import { ContractDisputesSection } from "./ContractDisputesSection";
import { ContractOverviewSection } from "./ContractOverviewSection";
import { ContractReviewsSection } from "./ContractReviewsSection";
import { ContractWorkSection } from "./ContractWorkSection";
import { getContractTimelineEvents } from "./contractDetailUtils";

export function ContractDetailPageClient({ contract, currentUserId }) {
  const router = useRouter();
  const [currentContract, setCurrentContract] = useState(contract);
  const [error, setError] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryAttachments, setDeliveryAttachments] = useState([]);
  const [cancellationReason, setCancellationReason] = useState("");
  const [milestoneEvidence, setMilestoneEvidence] = useState({});
  const [milestoneAttachments, setMilestoneAttachments] = useState({});
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
  const isPendingFreelancerSignature =
    currentContract.status === CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE;
  const isMilestoneContract =
    currentContract.contractType === CONTRACT_TYPE.MILESTONE_BASED;
  const canSign = isFreelancer && isPendingFreelancerSignature;
  const canEditPendingContract = isClient && isPendingFreelancerSignature;
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

  const freelancerRejectedContract = Boolean(
    currentContract.freelancerSignature?.rejectedAt,
  );

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
        milestoneAttachments[index] || [],
      ),
    );
    setMilestoneEvidence((previous) => ({ ...previous, [index]: "" }));
    setMilestoneAttachments((previous) => ({ ...previous, [index]: [] }));
  };

  const handleApproveMilestone = (index) => {
    runAction(() => approveContractMilestoneAction(currentContract._id, index));
  };

  const handleSubmitDelivery = () => {
    runAction(() =>
      submitContractWorkAction(
        currentContract._id,
        deliveryNotes,
        deliveryAttachments,
      ),
    );
    setDeliveryNotes("");
    setDeliveryAttachments([]);
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

  const handleCancelPendingContract = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await cancelPendingContractAction(currentContract._id);
        const proposalId = result?.data?.proposalId;

        if (proposalId) {
          router.push(`/proposals/${proposalId}`);
          router.refresh();
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch (actionError) {
        setError(actionError.message || "Something went wrong.");
      }
    });
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
  const timelineEvents = getContractTimelineEvents(currentContract);
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
          <div className="mb-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>

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

          <ContractOverviewSection
            contract={currentContract}
            freelancerRejectedContract={freelancerRejectedContract}
            remainingFundedBalance={remainingFundedBalance}
          />

          <ContractAttachmentsTimelineSection
            contract={currentContract}
            timelineEvents={timelineEvents}
          />

          <ContractWorkSection
            allMilestonesApproved={allMilestonesApproved}
            canCompleteContract={canCompleteContract}
            canSubmitDelivery={canSubmitDelivery}
            completedMilestones={completedMilestones}
            contract={currentContract}
            deliveryAttachments={deliveryAttachments}
            deliveryNotes={deliveryNotes}
            deliveryRevisionNotes={deliveryRevisionNotes}
            handleApproveMilestone={handleApproveMilestone}
            handleCompleteContract={handleCompleteContract}
            handleRequestDeliveryChanges={handleRequestDeliveryChanges}
            handleRequestMilestoneChanges={handleRequestMilestoneChanges}
            handleSubmitDelivery={handleSubmitDelivery}
            handleSubmitMilestone={handleSubmitMilestone}
            isActive={isActive}
            isClient={isClient}
            isFreelancer={isFreelancer}
            isMilestoneContract={isMilestoneContract}
            isPending={isPending}
            milestoneAttachments={milestoneAttachments}
            milestoneEvidence={milestoneEvidence}
            milestoneRevisionNotes={milestoneRevisionNotes}
            onDeliveryAttachmentRemove={(index) =>
              setDeliveryAttachments((previous) =>
                previous.filter((_, itemIndex) => itemIndex !== index),
              )
            }
            onDeliveryAttachmentUploaded={(upload) =>
              setDeliveryAttachments((previous) => [...previous, upload])
            }
            onDeliveryNotesChange={setDeliveryNotes}
            onDeliveryRevisionNotesChange={setDeliveryRevisionNotes}
            onMilestoneAttachmentRemove={(milestoneIndex, attachmentIndex) =>
              setMilestoneAttachments((previous) => ({
                ...previous,
                [milestoneIndex]: (previous[milestoneIndex] || []).filter(
                  (_, itemIndex) => itemIndex !== attachmentIndex,
                ),
              }))
            }
            onMilestoneAttachmentUploaded={(milestoneIndex, upload) =>
              setMilestoneAttachments((previous) => ({
                ...previous,
                [milestoneIndex]: [...(previous[milestoneIndex] || []), upload],
              }))
            }
            onMilestoneEvidenceChange={(index, value) =>
              setMilestoneEvidence((previous) => ({
                ...previous,
                [index]: value,
              }))
            }
            onMilestoneRevisionNotesChange={(index, value) =>
              setMilestoneRevisionNotes((previous) => ({
                ...previous,
                [index]: value,
              }))
            }
          />

          <ContractReviewsSection
            canReview={canReview}
            handleSubmitReview={handleSubmitReview}
            isPending={isPending}
            onReviewCommentChange={setReviewComment}
            onReviewRatingChange={setReviewRating}
            reviewComment={reviewComment}
            reviewRating={reviewRating}
            reviews={reviews}
          />

          <ContractDisputesSection
            activeDispute={activeDispute}
            canOpenDispute={canOpenDispute}
            contract={currentContract}
            disputeDescription={disputeDescription}
            disputeEvidenceAttachments={disputeEvidenceAttachments}
            disputeReason={disputeReason}
            disputes={disputes}
            handleOpenDispute={handleOpenDispute}
            isPending={isPending}
            onDisputeDescriptionChange={setDisputeDescription}
            onDisputeEvidenceRemove={(index) =>
              setDisputeEvidenceAttachments((previous) =>
                previous.filter((_, itemIndex) => itemIndex !== index),
              )
            }
            onDisputeEvidenceUploaded={(upload) =>
              setDisputeEvidenceAttachments((previous) => [...previous, upload])
            }
            onDisputeReasonChange={setDisputeReason}
          />

          <ContractCancellationSection
            cancellation={cancellation}
            cancellationReason={cancellationReason}
            canEditPendingContract={canEditPendingContract}
            canRequestCancellation={canRequestCancellation}
            canRespondCancellation={canRespondCancellation}
            contractStatus={currentContract.status}
            handleRequestCancellation={handleRequestCancellation}
            handleRespondCancellation={handleRespondCancellation}
            hasPendingCancellation={hasPendingCancellation}
            isCancellationInitiator={isCancellationInitiator}
            isPending={isPending}
            onCancellationReasonChange={setCancellationReason}
          />

          {error ? <div className="card-error mb-4">{error}</div> : null}

          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/jobs/${currentContract.job?._id || ""}`}
              className="btn btn-ghost"
            >
              View Job
            </Link>
            {canEditPendingContract ? (
              <>
                <Link
                  href={`/contracts/${currentContract._id}/edit`}
                  className="btn btn-secondary"
                >
                  Edit Contract
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancelPendingContract}
                  disabled={isPending}
                >
                  {isPending ? "Cancelling..." : "Cancel Contract"}
                </button>
              </>
            ) : null}
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
