import { Button, Input } from "@/shared/components/UI";

export function ProposalResubmitSection({
  handleResubmit,
  handleResubmitChange,
  isResubmitting,
  resubmitData,
  resubmitError,
}) {
  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <h3
        style={{
          fontSize: "var(--text-base)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-2)",
        }}
      >
        Resubmit Proposal
      </h3>
      <form
        onSubmit={handleResubmit}
        style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <Input
          type="number"
          label="Your Amount (NPR)"
          placeholder="Enter amount"
          value={resubmitData.amount}
          onChange={(event) =>
            handleResubmitChange("amount", event.target.value)
          }
          min="1"
          required
          disabled={isResubmitting}
        />
        <div style={{ marginTop: "var(--space-4)" }}>
          <label
            htmlFor="resubmitCoverLetter"
            style={{
              display: "block",
              marginBottom: "var(--space-2)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Cover Letter *
          </label>
          <textarea
            id="resubmitCoverLetter"
            value={resubmitData.coverLetter}
            onChange={(event) =>
              handleResubmitChange("coverLetter", event.target.value)
            }
            placeholder="Describe why you're the best fit for this job..."
            rows={5}
            style={{
              width: "100%",
              padding: "var(--space-3)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
              fontFamily: "inherit",
              fontSize: "var(--text-sm)",
              resize: "vertical",
            }}
            maxLength={5000}
            required
            disabled={isResubmitting}
          />
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-light)",
              marginTop: "var(--space-1)",
            }}
          >
            {resubmitData.coverLetter.length}/5000 characters
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            marginTop: "var(--space-4)",
          }}
        >
          <Input
            type="number"
            label="Delivery Days *"
            placeholder="e.g., 7"
            value={resubmitData.deliveryDays}
            onChange={(event) =>
              handleResubmitChange("deliveryDays", event.target.value)
            }
            min="1"
            required
            disabled={isResubmitting}
          />
          <Input
            type="number"
            label="Revisions Included"
            placeholder="e.g., 2"
            value={resubmitData.revisionsIncluded}
            onChange={(event) =>
              handleResubmitChange("revisionsIncluded", event.target.value)
            }
            min="0"
            disabled={isResubmitting}
          />
        </div>
        <div style={{ marginTop: "var(--space-4)" }}>
          <Input
            type="text"
            label="Attachments (comma-separated URLs)"
            placeholder="https://example.com/file1.pdf, https://example.com/file2.pdf"
            value={resubmitData.attachments}
            onChange={(event) =>
              handleResubmitChange("attachments", event.target.value)
            }
            disabled={isResubmitting}
          />
        </div>
        {resubmitError && (
          <p className="card-error" style={{ marginTop: "var(--space-3)" }}>
            {resubmitError}
          </p>
        )}
        <div style={{ marginTop: "var(--space-4)" }}>
          <Button type="submit" disabled={isResubmitting}>
            {isResubmitting ? "Resubmitting..." : "Resubmit Proposal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
