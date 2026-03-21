"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { JobDetailSummarySection } from "@/features/jobs/components/JobDetailSummarySection";
import { JobProposalFormSection } from "@/features/jobs/components/JobProposalFormSection";
import { createProposalMutationAction } from "@/lib/actions/proposals";
import { JOB_STATUS } from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  getCreatorLabel,
} from "@/shared/utils/job";

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function JobDetailPageClient({
  conversationId = null,
  existingProposalId = null,
  initialJob,
  initialUser,
}) {
  const router = useRouter();
  const user = initialUser;
  const [job] = useState(initialJob);
  const [amount, setAmount] = useState("");
  const [pricingType, setPricingType] = useState("fixed_quote");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisionsIncluded, setRevisionsIncluded] = useState("0");
  const [visitAvailableOn, setVisitAvailableOn] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [proposalError, setProposalError] = useState("");
  const [isProposalPending, startProposalTransition] = useTransition();

  const creatorLabel = getCreatorLabel(job.creatorAddress);
  const budgetDisplay =
    job.budgetType === "inspection_required"
      ? "Inspection Required"
      : job.budget
        ? formatBudget(job.budget)
        : "Negotiable";
  const locationText = formatLocation(job.location);
  const deadlineText = formatDate(job.deadline);

  const currentUserId = user?.id || user?._id;
  const isJobOwner =
    user &&
    (job.creatorAddress?._id === currentUserId ||
      job.creatorAddress === currentUserId ||
      job.creatorAddress?.id === currentUserId);

  const handleSubmitProposal = async (event) => {
    event.preventDefault();
    setProposalError("");
    startProposalTransition(async () => {
      try {
        await createProposalMutationAction({
          job: job._id,
          pricingType,
          amount,
          coverLetter,
          deliveryDays,
          revisionsIncluded,
          visitAvailableOn,
          inspectionNotes,
          attachments,
        });
        router.push("/dashboard");
      } catch (error) {
        setProposalError(error.message || "Failed to submit proposal");
      }
    });
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
            creatorLabel={creatorLabel}
            deadlineText={deadlineText}
            job={job}
            locationText={locationText}
          />

          {job.activeContract ? (
            <div style={{ marginTop: "var(--space-6)" }}>
              <h3
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Contract
              </h3>
              <div className="card-sm">
                <p
                  className="text-light"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  This job is being handled through its contract. Milestones,
                  delivery, cancellation, and completion now live there.
                </p>
                <Link
                  href={`/contracts/${
                    job.activeContract?._id || job.activeContract
                  }`}
                  className="btn btn-secondary btn-sm"
                >
                  View Contract
                </Link>
                {conversationId ? (
                  <Link
                    href={`/messages/${conversationId}`}
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: "var(--space-2)" }}
                  >
                    Open Chat
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {job.status === JOB_STATUS.OPEN && !isJobOwner ? (
          existingProposalId ? (
            <div className="card" style={{ marginTop: "var(--space-6)" }}>
              <h2
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Proposal already submitted
              </h2>
              <p
                className="text-light"
                style={{ marginBottom: "var(--space-4)" }}
              >
                You already applied to this job. Open your proposal to review or
                edit it instead of submitting a duplicate.
              </p>
              <Link
                href={`/proposals/${existingProposalId}`}
                className="btn btn-primary"
              >
                Edit Proposal
              </Link>
            </div>
          ) : (
            <JobProposalFormSection
              amount={amount}
              attachments={attachments}
              coverLetter={coverLetter}
              deliveryDays={deliveryDays}
              inspectionNotes={inspectionNotes}
              handleSubmitProposal={handleSubmitProposal}
              isProposalPending={isProposalPending}
              job={job}
              pricingType={pricingType}
              proposalError={proposalError}
              revisionsIncluded={revisionsIncluded}
              router={router}
              setAmount={setAmount}
              setAttachments={setAttachments}
              setCoverLetter={setCoverLetter}
              setDeliveryDays={setDeliveryDays}
              setInspectionNotes={setInspectionNotes}
              setPricingType={setPricingType}
              setRevisionsIncluded={setRevisionsIncluded}
              setVisitAvailableOn={setVisitAvailableOn}
              visitAvailableOn={visitAvailableOn}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
