"use client";

import { useState } from "react";
import { Button, Input } from "@/shared/components/UI";
import { JOB_STATUS, MILESTONE_STATUS } from "@/shared/constants/statuses";
import {
  formatBudget,
  formatLocation,
  formatStatus,
  getCreatorLabel,
  getMilestoneTotal,
  hasMilestones,
} from "@/shared/utils/job";
import {
  getFieldError,
  proposalSchema,
  validateForm,
} from "@/shared/validation";

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const JobModal = ({
  job,
  mode = "view",
  onSubmit,
  onSubmitMilestone,
  onApproveMilestone,
  onClose,
  loading = false,
  userRole,
  currentUser,
}) => {
  const currentUserId = currentUser?.id || currentUser?._id;
  const isJobOwner =
    currentUser &&
    (job.creatorAddress?._id === currentUserId ||
      job.creatorAddress === currentUserId ||
      job.creatorAddress?.id === currentUserId);
  const [amount, setAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisionsIncluded, setRevisionsIncluded] = useState("0");
  const [attachments, setAttachments] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [evidenceInputs, setEvidenceInputs] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});

    const attachmentsArray = attachments
      ? attachments
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    const submitData = {
      job: job._id,
      amount: Number(amount),
      coverLetter: coverLetter.trim(),
      deliveryDays: Number(deliveryDays),
      revisionsIncluded: Number(revisionsIncluded) || 0,
      attachments: attachmentsArray,
    };

    const { errors: validationErrors, data } = validateForm(
      proposalSchema,
      submitData,
    );

    if (validationErrors) {
      if (attachmentsArray.length > 0) {
        const invalidUrl = attachmentsArray.find(
          (item) => !/^https?:\/\//i.test(item),
        );
        if (invalidUrl) {
          setErrors((prev) => ({
            ...prev,
            attachments: "Attachments must be valid URLs",
          }));
          return;
        }
      }
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err.message || "Failed to submit proposal");
    }
  };

  const isProposalMode = mode === "proposal";
  const milestones = Array.isArray(job.milestones) ? job.milestones : [];
  const totalValue = getMilestoneTotal(milestones);
  const completedCount = milestones.filter(
    (milestone) => milestone?.status === MILESTONE_STATUS.COMPLETED,
  ).length;
  const canSubmitMilestone =
    userRole === "freelancer" && job.status === JOB_STATUS.IN_PROGRESS;
  const canApproveMilestone = userRole === "client" && isJobOwner;
  const creatorLabel = getCreatorLabel(job.creatorAddress);
  const budgetDisplay = job.budget
    ? formatBudget(job.budget, job.budgetType)
    : hasMilestones(milestones)
      ? `NPR ${totalValue.toLocaleString()}`
      : "Negotiable";
  const locationText = formatLocation(job.location);
  const deadlineText = formatDate(job.deadline);

  const handleEvidenceChange = (index, value) => {
    setEvidenceInputs((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSubmitMilestoneClick = async (jobId, index) => {
    const evidence = evidenceInputs[index];
    await onSubmitMilestone?.(jobId, index, evidence);
    setEvidenceInputs((prev) => ({
      ...prev,
      [index]: "",
    }));
  };

  return (
    <div className="proposal-modal-overlay">
      <div
        className="proposal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="proposal-modal-header">
          <h2 id="modal-title" className="proposal-modal-title">
            {isProposalMode ? "Submit Proposal" : "Job Details"}
          </h2>
        </div>

        <div className="proposal-modal-job-info">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <h3
              className="proposal-modal-job-title"
              style={{ margin: 0, textAlign: "left" }}
            >
              {job.title}
            </h3>
            <span
              className="job-card-budget"
              style={{ fontSize: "1.1rem", whiteSpace: "nowrap" }}
            >
              {budgetDisplay}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              margin: "0.75rem 0",
              alignItems: "center",
            }}
          >
            <span
              className={`status-badge status-${job.status?.toLowerCase()}`}
            >
              {formatStatus(job.status)}
            </span>
            {job.jobType && (
              <span
                className="badge"
                style={{
                  background: "var(--color-secondary-lightest)",
                  color: "var(--color-secondary)",
                }}
              >
                {job.jobType}
              </span>
            )}
            {job.category && (
              <span
                className="badge"
                style={{
                  background: "var(--color-primary-lightest)",
                  color: "var(--color-primary)",
                }}
              >
                {job.category}
              </span>
            )}
            {job.experienceLevel && (
              <span
                className="badge"
                style={{
                  background: "var(--color-warning-lightest)",
                  color: "var(--color-warning-dark)",
                }}
              >
                {job.experienceLevel}
              </span>
            )}
            {job.isUrgent && <span className="badge badge-error">Urgent</span>}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              margin: "0.75rem 0",
              padding: "0.75rem",
              background: "rgba(0,0,0,0.03)",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {creatorLabel && (
              <span
                className="profile-role-badge"
                style={{ background: "transparent", padding: 0 }}
              >
                Creator:{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {creatorLabel}
                </span>
              </span>
            )}
            {locationText && (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-light)",
                }}
              >
                📍 {locationText}
              </span>
            )}
            {deadlineText && (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-light)",
                }}
              >
                📅 Due: {deadlineText}
              </span>
            )}
            {hasMilestones(milestones) && (
              <span
                className="profile-role-badge"
                style={{ background: "transparent", padding: 0 }}
              >
                Milestones:{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {completedCount}/{milestones.length}
                </span>
              </span>
            )}
          </div>

          {job.description && (
            <p
              className="proposal-modal-job-description"
              style={{ textAlign: "left" }}
            >
              {job.description}
            </p>
          )}

          {job.requiredSkills?.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.875rem" }}>Required Skills:</strong>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="badge"
                    style={{ background: "var(--color-border-light)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.tags?.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.875rem" }}>Tags:</strong>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge"
                    style={{ background: "var(--color-border-light)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.attachments?.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.875rem" }}>Attachments:</strong>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {job.attachments.map((attachment) => (
                  <a
                    key={attachment}
                    href={attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                  >
                    Open attachment {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {milestones.length > 0 ? (
            <div
              className="proposal-modal-job-description"
              style={{ marginTop: "1rem" }}
            >
              <strong>Milestones</strong>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
                {milestones.map((milestone, index) => (
                  <li key={`${milestone?.title || "milestone"}-${index}`}>
                    {milestone?.title || "Untitled"} -{" "}
                    {milestone?.value
                      ? `NPR ${Number(milestone.value).toLocaleString()}`
                      : "N/A"}{" "}
                    ({formatStatus(milestone?.status)})
                    {milestone?.evidence && (
                      <span style={{ marginLeft: "0.5rem" }}>
                        Evidence: {milestone.evidence}
                      </span>
                    )}
                    {(() => {
                      const previousCompleted =
                        index === 0 ||
                        milestones[index - 1]?.status ===
                          MILESTONE_STATUS.COMPLETED;
                      if (
                        !canSubmitMilestone ||
                        milestone?.status !== "ACTIVE"
                      ) {
                        return null;
                      }

                      return (
                        <span className="milestone-action-row">
                          <Input
                            type="text"
                            label="Evidence"
                            placeholder="Paste link or notes"
                            value={evidenceInputs[index] || ""}
                            onChange={(e) =>
                              handleEvidenceChange(index, e.target.value)
                            }
                            disabled={loading || !previousCompleted}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              handleSubmitMilestoneClick(job._id, index)
                            }
                            className="milestone-action"
                            disabled={loading || !previousCompleted}
                          >
                            Submit
                          </Button>
                        </span>
                      );
                    })()}
                    {canApproveMilestone &&
                      milestone?.status === "SUBMITTED" &&
                      onApproveMilestone && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onApproveMilestone(job._id, index)}
                          className="milestone-action"
                          style={{ marginLeft: "0.5rem" }}
                        >
                          Approve
                        </Button>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="proposal-modal-job-description">
              No milestones defined yet.
            </p>
          )}
        </div>

        {isProposalMode && !isJobOwner ? (
          <form onSubmit={handleSubmit} className="proposal-modal-form">
            <Input
              type="number"
              label="Your Amount (NPR)"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={getFieldError(errors, "amount")}
              min="1"
              required
              disabled={loading}
            />

            <div style={{ marginTop: "1rem" }}>
              <label
                htmlFor="coverLetter"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Cover Letter *
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Describe why you're the best fit for this job..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  border: `1px solid ${getFieldError(errors, "coverLetter") ? "var(--color-error)" : "var(--color-border)"}`,
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  resize: "vertical",
                }}
                maxLength={5000}
                required
                disabled={loading}
              />
              {getFieldError(errors, "coverLetter") && (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {getFieldError(errors, "coverLetter")}
                </p>
              )}
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-light)",
                  marginTop: "0.25rem",
                }}
              >
                {coverLetter.length}/5000 characters
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <Input
                type="number"
                label="Delivery Days *"
                placeholder="e.g., 7"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                error={getFieldError(errors, "deliveryDays")}
                min="1"
                required
                disabled={loading}
              />
              <Input
                type="number"
                label="Revisions Included"
                placeholder="e.g., 2"
                value={revisionsIncluded}
                onChange={(e) => setRevisionsIncluded(e.target.value)}
                error={getFieldError(errors, "revisionsIncluded")}
                min="0"
                disabled={loading}
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <Input
                type="text"
                label="Attachments (comma-separated URLs)"
                placeholder="https://example.com/file1.pdf, https://example.com/file2.pdf"
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                error={getFieldError(errors, "attachments")}
                disabled={loading}
              />
            </div>

            {error && <p className="proposal-modal-error">{error}</p>}

            <div className="proposal-modal-actions">
              <Button
                type="submit"
                disabled={loading || !amount || !coverLetter || !deliveryDays}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="modal-close-btn"
                style={{ border: "1px solid var(--color-primary)" }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="proposal-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="modal-close-btn"
              style={{ border: "1px solid var(--color-primary)" }}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
