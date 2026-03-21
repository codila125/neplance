import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Button, Input } from "@/shared/components/UI";

export function ProposalResubmitSection({
  buttonLabel = "Resubmit Proposal",
  handleResubmit,
  handleResubmitChange,
  isResubmitting,
  resubmitData,
  resubmitError,
  title = "Resubmit Proposal",
  isPhysicalJob = false,
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
        {title}
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
          placeholder={
            resubmitData.pricingType === "inspection_required"
              ? "0 until inspection"
              : "Enter amount"
          }
          value={resubmitData.amount}
          onChange={(event) =>
            handleResubmitChange("amount", event.target.value)
          }
          min="0"
          required={resubmitData.pricingType !== "inspection_required"}
          disabled={isResubmitting}
        />
        {isPhysicalJob ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <label className="form-label" htmlFor="proposal-pricing-type">
              Quote Type
            </label>
            <select
              id="proposal-pricing-type"
              className="form-select"
              value={resubmitData.pricingType || "fixed_quote"}
              onChange={(event) =>
                handleResubmitChange("pricingType", event.target.value)
              }
              disabled={isResubmitting}
            >
              <option value="fixed_quote">I can quote now</option>
              <option value="inspection_required">
                Inspection required first
              </option>
            </select>
          </div>
        ) : null}
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
        {isPhysicalJob ? (
          <>
            <Input
              type="date"
              label="Visit Available On"
              value={resubmitData.visitAvailableOn || ""}
              onChange={(event) =>
                handleResubmitChange("visitAvailableOn", event.target.value)
              }
              disabled={isResubmitting}
            />
            <div style={{ marginTop: "var(--space-4)" }}>
              <label className="form-label" htmlFor="inspection-notes">
                Inspection / On-site Notes
              </label>
              <textarea
                id="inspection-notes"
                className="form-input"
                rows={3}
                value={resubmitData.inspectionNotes || ""}
                onChange={(event) =>
                  handleResubmitChange("inspectionNotes", event.target.value)
                }
                disabled={isResubmitting}
              />
            </div>
          </>
        ) : null}
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
          <div
            style={{
              display: "block",
              marginBottom: "var(--space-2)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Proposal Attachments
          </div>
          <CloudinaryFileUploader
            buttonLabel="Upload Proposal Attachment"
            disabled={isResubmitting}
            folder="proposal-attachments"
            onUploaded={(upload) =>
              handleResubmitChange("attachments", [
                ...(resubmitData.attachments || []),
                upload.url,
              ])
            }
          />
          {resubmitData.attachments?.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "var(--space-3)",
                marginTop: "var(--space-3)",
              }}
            >
              {resubmitData.attachments.map((attachment, index) => (
                <div key={attachment} className="card-sm">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--space-3)",
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
                      onClick={() =>
                        handleResubmitChange(
                          "attachments",
                          resubmitData.attachments.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-light" style={{ marginTop: "var(--space-2)" }}>
              No attachments uploaded yet.
            </p>
          )}
        </div>
        {resubmitError && (
          <p className="card-error" style={{ marginTop: "var(--space-3)" }}>
            {resubmitError}
          </p>
        )}
        <div style={{ marginTop: "var(--space-4)" }}>
          <Button type="submit" disabled={isResubmitting}>
            {isResubmitting ? "Saving..." : buttonLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
