import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Button, Input } from "@/shared/components/UI";

export function JobProposalFormSection({
  amount,
  attachments,
  coverLetter,
  deliveryDays,
  handleSubmitProposal,
  isProposalPending,
  proposalError,
  revisionsIncluded,
  router,
  setAmount,
  setAttachments,
  setCoverLetter,
  setDeliveryDays,
  setRevisionsIncluded,
}) {
  const removeAttachment = (index) => {
    setAttachments((previous) =>
      previous.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  };

  const handleUploadedAttachment = (upload) => {
    setAttachments((previous) => [...previous, upload.url]);
  };

  return (
    <div className="card" style={{ marginTop: "var(--space-6)" }}>
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-4)",
        }}
      >
        Submit Proposal
      </h2>
      <form onSubmit={handleSubmitProposal}>
        <Input
          type="number"
          label="Your Amount (NPR)"
          placeholder="Enter amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          min="1"
          required
          disabled={isProposalPending}
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
            onChange={(event) => setCoverLetter(event.target.value)}
            placeholder="Describe why you're the best fit for this job..."
            rows={5}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              resize: "vertical",
            }}
            maxLength={5000}
            required
            disabled={isProposalPending}
          />
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
            onChange={(event) => setDeliveryDays(event.target.value)}
            min="1"
            required
            disabled={isProposalPending}
          />
          <Input
            type="number"
            label="Revisions Included"
            placeholder="e.g., 2"
            value={revisionsIncluded}
            onChange={(event) => setRevisionsIncluded(event.target.value)}
            min="0"
            disabled={isProposalPending}
          />
        </div>

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
            disabled={isProposalPending}
            folder="proposal-attachments"
            onUploaded={handleUploadedAttachment}
          />
          {attachments.length > 0 ? (
            <div
              style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}
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

        {proposalError && (
          <p className="card-error" style={{ marginTop: "1rem" }}>
            {proposalError}
          </p>
        )}

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <Button
            type="submit"
            disabled={
              isProposalPending || !amount || !coverLetter || !deliveryDays
            }
          >
            {isProposalPending ? "Submitting..." : "Submit Proposal"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
