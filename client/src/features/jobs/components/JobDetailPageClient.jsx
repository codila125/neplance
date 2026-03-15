"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { JobCancellationSection } from "@/features/jobs/components/JobCancellationSection";
import { JobDetailSummarySection } from "@/features/jobs/components/JobDetailSummarySection";
import { JobMilestonesSection } from "@/features/jobs/components/JobMilestonesSection";
import { JobProposalFormSection } from "@/features/jobs/components/JobProposalFormSection";
import {
  approveMilestoneAction,
  requestJobCancellationAction,
  respondJobCancellationAction,
  submitMilestoneAction,
} from "@/lib/actions/jobs";
import { createProposalMutationAction } from "@/lib/actions/proposals";
import {
  CANCELLATION_STATUS,
  JOB_STATUS,
  MILESTONE_STATUS,
} from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  getCreatorLabel,
  getMilestoneTotal,
  hasMilestones,
} from "@/shared/utils/job";

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function JobDetailPageClient({ initialJob, initialUser }) {
  const router = useRouter();
  const user = initialUser;
  const [job, setJob] = useState(initialJob);
  const [amount, setAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisionsIncluded, setRevisionsIncluded] = useState("0");
  const [attachments, setAttachments] = useState("");
  const [proposalError, setProposalError] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationActionLoading, setCancellationActionLoading] =
    useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const [milestoneEvidence, setMilestoneEvidence] = useState({});
  const [milestoneError, setMilestoneError] = useState("");
  const [isSubmittingMilestone, startMilestoneSubmitTransition] =
    useTransition();
  const [isApprovingMilestone, startMilestoneApproveTransition] =
    useTransition();
  const [isProposalPending, startProposalTransition] = useTransition();

  const milestones = Array.isArray(job.milestones) ? job.milestones : [];
  const totalValue = getMilestoneTotal(milestones);
  const completedCount = milestones.filter(
    (milestone) => milestone?.status === MILESTONE_STATUS.COMPLETED,
  ).length;
  const creatorLabel = getCreatorLabel(job.creatorAddress);
  const budgetDisplay = job.budget
    ? formatBudget(job.budget, job.budgetType)
    : hasMilestones(milestones)
      ? `NPR ${totalValue.toLocaleString()}`
      : "Negotiable";
  const locationText = formatLocation(job.location);
  const deadlineText = formatDate(job.deadline);

  const currentUserId = user?.id || user?._id;
  const isJobOwner =
    user &&
    (job.creatorAddress?._id === currentUserId ||
      job.creatorAddress === currentUserId ||
      job.creatorAddress?.id === currentUserId);
  const isContractor = (job.parties || []).some(
    (party) =>
      party.role === "CONTRACTOR" &&
      String(party.address) === String(currentUserId),
  );
  const userRole = user?.role?.[0];
  const canCancel =
    job.status === JOB_STATUS.IN_PROGRESS && (isJobOwner || isContractor);
  const cancellation = job.cancellation || { status: CANCELLATION_STATUS.NONE };
  const initiatedBy = cancellation.initiatedBy?._id || cancellation.initiatedBy;
  const isInitiator = initiatedBy
    ? String(initiatedBy) === String(currentUserId)
    : cancellation.initiatedRole
      ? (cancellation.initiatedRole === "CREATOR" && isJobOwner) ||
        (cancellation.initiatedRole === "CONTRACTOR" && isContractor)
      : false;
  const hasPendingCancellation =
    cancellation.status === CANCELLATION_STATUS.PENDING;

  const canSubmitMilestone =
    job.status === JOB_STATUS.IN_PROGRESS &&
    userRole === "freelancer" &&
    isContractor;
  const canApproveMilestone = userRole === "client" && isJobOwner;

  const handleSubmitProposal = async (event) => {
    event.preventDefault();
    setProposalError("");
    startProposalTransition(async () => {
      try {
        await createProposalMutationAction({
          job: job._id,
          amount,
          coverLetter,
          deliveryDays,
          revisionsIncluded,
          attachments,
        });
        router.push("/dashboard");
      } catch (error) {
        setProposalError(error.message || "Failed to submit proposal");
      }
    });
  };

  const handleMilestoneEvidenceChange = (index, value) => {
    setMilestoneEvidence((previous) => ({ ...previous, [index]: value }));
  };

  const handleSubmitMilestone = async (index) => {
    setMilestoneError("");
    startMilestoneSubmitTransition(async () => {
      try {
        const result = await submitMilestoneAction(
          job._id,
          index,
          milestoneEvidence[index],
        );
        setMilestoneEvidence((previous) => ({ ...previous, [index]: "" }));
        setJob(result.data);
      } catch (error) {
        setMilestoneError(error.message || "Failed to submit milestone");
      }
    });
  };

  const handleApproveMilestone = async (index) => {
    setMilestoneError("");
    startMilestoneApproveTransition(async () => {
      try {
        const result = await approveMilestoneAction(job._id, index);
        setJob(result.data);
      } catch (error) {
        setMilestoneError(error.message || "Failed to approve milestone");
      }
    });
  };

  const handleRequestCancellation = async () => {
    setCancellationError("");
    setCancellationLoading(true);
    try {
      const result = await requestJobCancellationAction(
        job._id,
        cancellationReason,
      );
      setCancellationReason("");
      setJob(result.data);
    } catch (error) {
      setCancellationError(error.message || "Failed to request cancellation");
    } finally {
      setCancellationLoading(false);
    }
  };

  const handleRespondCancellation = async (action) => {
    setCancellationError("");
    setCancellationActionLoading(true);
    try {
      const result = await respondJobCancellationAction(job._id, action);
      setJob(result.data);
    } catch (error) {
      setCancellationError(
        error.message || "Failed to respond to cancellation",
      );
    } finally {
      setCancellationActionLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div style={{ marginBottom: "var(--space-6)" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>

        <div className="card">
          <JobDetailSummarySection
            budgetDisplay={budgetDisplay}
            completedCount={completedCount}
            creatorLabel={creatorLabel}
            deadlineText={deadlineText}
            job={job}
            locationText={locationText}
            milestones={milestones}
          />

          <JobMilestonesSection
            canApproveMilestone={canApproveMilestone}
            canSubmitMilestone={canSubmitMilestone}
            handleApproveMilestone={handleApproveMilestone}
            handleMilestoneEvidenceChange={handleMilestoneEvidenceChange}
            handleSubmitMilestone={handleSubmitMilestone}
            isApprovingMilestone={isApprovingMilestone}
            isSubmittingMilestone={isSubmittingMilestone}
            milestoneError={milestoneError}
            milestoneEvidence={milestoneEvidence}
            milestones={milestones}
          />

          <JobCancellationSection
            canCancel={canCancel}
            cancellation={cancellation}
            cancellationActionLoading={cancellationActionLoading}
            cancellationError={cancellationError}
            cancellationLoading={cancellationLoading}
            cancellationReason={cancellationReason}
            hasPendingCancellation={hasPendingCancellation}
            handleRequestCancellation={handleRequestCancellation}
            handleRespondCancellation={handleRespondCancellation}
            isInitiator={isInitiator}
            setCancellationReason={setCancellationReason}
          />
        </div>

        {job.status === JOB_STATUS.OPEN && !isJobOwner && (
          <JobProposalFormSection
            amount={amount}
            attachments={attachments}
            coverLetter={coverLetter}
            deliveryDays={deliveryDays}
            handleSubmitProposal={handleSubmitProposal}
            isProposalPending={isProposalPending}
            proposalError={proposalError}
            revisionsIncluded={revisionsIncluded}
            router={router}
            setAmount={setAmount}
            setAttachments={setAttachments}
            setCoverLetter={setCoverLetter}
            setDeliveryDays={setDeliveryDays}
            setRevisionsIncluded={setRevisionsIncluded}
          />
        )}
      </div>
    </div>
  );
}
