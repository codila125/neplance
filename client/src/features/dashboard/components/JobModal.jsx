"use client";

import Link from "next/link";
import { useState } from "react";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Button, Input } from "@/shared/components/UI";
import {
  formatBudget,
  formatLocation,
  formatStatus,
  getCreatorLabel,
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
  onClose,
  loading = false,
  currentUser,
}) => {
  const currentUserId = currentUser?.id || currentUser?._id;
  const isJobOwner =
    currentUser &&
    (job.creatorAddress?._id === currentUserId ||
      job.creatorAddress === currentUserId ||
      job.creatorAddress?.id === currentUserId);
  const [amount, setAmount] = useState("");
  const [pricingType, setPricingType] = useState("fixed_quote");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisionsIncluded, setRevisionsIncluded] = useState("0");
  const [visitAvailableOn, setVisitAvailableOn] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});

    const submitData = {
      job: job._id,
      pricingType,
      amount: Number(amount),
      coverLetter: coverLetter.trim(),
      deliveryDays: Number(deliveryDays),
      revisionsIncluded: Number(revisionsIncluded) || 0,
      visitAvailableOn,
      inspectionNotes: inspectionNotes.trim(),
      attachments,
    };

    const { errors: validationErrors, data } = validateForm(
      proposalSchema,
      submitData,
    );

    if (validationErrors) {
      if (attachments.length > 0) {
        const invalidUrl = attachments.find(
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

  const handleUploadedAttachment = (upload) => {
    setAttachments((previous) => [...previous, upload.url]);
  };

  const removeAttachment = (index) => {
    setAttachments((previous) =>
      previous.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  };

  const isProposalMode = mode === "proposal";
  const creatorLabel = getCreatorLabel(job.creatorAddress);
  const budgetDisplay =
    job.budgetType === "inspection_required"
      ? "Inspection Required"
      : job.budget
        ? formatBudget(job.budget)
        : "Negotiable";
  const locationText = formatLocation(job.location);
  const deadlineText = formatDate(job.deadline);

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
          </div>

          {job.description && (
            <p
              className="proposal-modal-job-description"
              style={{ textAlign: "left" }}
            >
              {job.description}
            </p>
          )}

          {job.jobType === "physical" && job.physicalDetails ? (
            <div style={{ marginTop: "0.75rem" }}>
              <strong style={{ fontSize: "0.875rem" }}>On-site details:</strong>
              <div
                style={{
                  display: "grid",
                  gap: "0.35rem",
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                {job.physicalDetails.serviceCategory ? (
                  <div>Service: {job.physicalDetails.serviceCategory}</div>
                ) : null}
                {job.physicalDetails.siteVisitRequired ? (
                  <div>Site visit required before final agreement</div>
                ) : null}
                {job.physicalDetails.preferredVisitDate ? (
                  <div>
                    Preferred visit:{" "}
                    {new Date(
                      job.physicalDetails.preferredVisitDate,
                    ).toLocaleDateString("en-NP")}
                  </div>
                ) : null}
                {job.physicalDetails.preferredWorkDate ? (
                  <div>
                    Preferred work date:{" "}
                    {new Date(
                      job.physicalDetails.preferredWorkDate,
                    ).toLocaleDateString("en-NP")}
                  </div>
                ) : null}
                {job.physicalDetails.materialsPreference ? (
                  <div>Materials: {job.physicalDetails.materialsPreference}</div>
                ) : null}
              </div>
            </div>
          ) : null}

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
                {job.attachments.map((attachment, index) => (
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
          {job.activeContract ? (
            <div
              className="proposal-modal-job-description"
              style={{ marginTop: "1rem" }}
            >
              <strong>Contract</strong>
              <p className="text-light" style={{ marginTop: "0.5rem" }}>
                Active work is managed inside the contract, including
                milestones, delivery, and cancellation.
              </p>
              <Link
                href={`/contracts/${job.activeContract?._id || job.activeContract}`}
                className="btn btn-secondary btn-sm"
              >
                View Contract
              </Link>
            </div>
          ) : null}
        </div>

        {isProposalMode && !isJobOwner ? (
          <form onSubmit={handleSubmit} className="proposal-modal-form">
            {job.jobType === "physical" ? (
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="proposalPricingType"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  Quote Type
                </label>
                <select
                  id="proposalPricingType"
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="fixed_quote">I can quote now</option>
                  <option value="inspection_required">
                    Inspection required first
                  </option>
                </select>
              </div>
            ) : null}
            <Input
              type="number"
              label="Your Amount (NPR)"
              placeholder={
                pricingType === "inspection_required"
                  ? "0 until inspection"
                  : "Enter amount"
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={getFieldError(errors, "amount")}
              min="0"
              required={pricingType !== "inspection_required"}
              disabled={loading}
            />
            {job.jobType === "physical" ? (
              <p className="text-light" style={{ marginTop: "0.5rem" }}>
                For on-site work, you can choose inspection required and settle
                the final amount at contract creation after the visit.
              </p>
            ) : null}

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

            {job.jobType === "physical" ? (
              <>
                <div style={{ marginTop: "1rem" }}>
                  <Input
                    type="date"
                    label="Visit Available On"
                    value={visitAvailableOn}
                    onChange={(e) => setVisitAvailableOn(e.target.value)}
                    error={getFieldError(errors, "visitAvailableOn")}
                    disabled={loading}
                  />
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <label
                    htmlFor="inspectionNotes"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 500,
                    }}
                  >
                    Inspection / On-site Notes
                  </label>
                  <textarea
                    id="inspectionNotes"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "4px",
                      border: "1px solid var(--color-border)",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                      resize: "vertical",
                    }}
                    disabled={loading}
                  />
                </div>
              </>
            ) : null}

            <div style={{ marginTop: "1rem" }}>
              <div
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Proposal Attachments
              </div>
              <CloudinaryFileUploader
                buttonLabel="Upload Proposal Attachment"
                disabled={loading}
                folder="proposal-attachments"
                onUploaded={handleUploadedAttachment}
              />
              {getFieldError(errors, "attachments") ? (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {getFieldError(errors, "attachments")}
                </p>
              ) : null}
              {attachments.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                  }}
                >
                  {attachments.map((attachment, index) => (
                    <div key={attachment} className="card-sm">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-link"
                        >
                          Attachment {index + 1}
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeAttachment(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-light)",
                    marginTop: "0.5rem",
                  }}
                >
                  No attachments uploaded yet.
                </p>
              )}
            </div>

            {error && <p className="proposal-modal-error">{error}</p>}

            <div className="proposal-modal-actions">
              <Button
                type="submit"
                disabled={
                  loading ||
                  (!amount && pricingType !== "inspection_required") ||
                  !coverLetter ||
                  !deliveryDays
                }
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
