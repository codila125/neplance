import { Button } from "@/shared/components/UI";
import { CANCELLATION_STATUS } from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

export function JobCancellationSection({
  canCancel,
  cancellation,
  cancellationActionLoading,
  cancellationError,
  cancellationLoading,
  cancellationReason,
  hasPendingCancellation,
  handleRequestCancellation,
  handleRespondCancellation,
  isInitiator,
  setCancellationReason,
}) {
  if (!canCancel) {
    return null;
  }

  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-3)",
        }}
      >
        Cancellation
      </h2>
      <div
        style={{
          padding: "var(--space-4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
            marginBottom: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <span className="badge badge-warning">
            {formatStatus(cancellation.status || CANCELLATION_STATUS.NONE)}
          </span>
          {cancellation.initiatedRole && (
            <span style={{ fontSize: "var(--text-sm)" }}>
              Initiated by: {cancellation.initiatedRole.toLowerCase()}
            </span>
          )}
        </div>

        {cancellation.reason && (
          <p className="text-light" style={{ marginBottom: "var(--space-3)" }}>
            Reason: {cancellation.reason}
          </p>
        )}

        {hasPendingCancellation ? (
          isInitiator ? (
            <p className="text-light">
              Waiting for the other party to respond.
            </p>
          ) : (
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Button
                type="button"
                onClick={() => handleRespondCancellation("accept")}
                disabled={cancellationActionLoading}
              >
                {cancellationActionLoading ? "Processing..." : "Accept"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleRespondCancellation("reject")}
                disabled={cancellationActionLoading}
              >
                Reject
              </Button>
            </div>
          )
        ) : (
          <div>
            <label
              htmlFor="cancellationReason"
              style={{
                display: "block",
                marginBottom: "var(--space-2)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              Cancellation Reason
            </label>
            <textarea
              id="cancellationReason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Share why you are cancelling (optional)"
              rows={4}
              style={{
                width: "100%",
                padding: "var(--space-3)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--color-border)",
                fontFamily: "inherit",
                fontSize: "var(--text-sm)",
                resize: "vertical",
              }}
              disabled={cancellationLoading}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleRequestCancellation}
                disabled={cancellationLoading}
              >
                {cancellationLoading ? "Requesting..." : "Request Cancellation"}
              </Button>
            </div>
          </div>
        )}

        {cancellationError && (
          <p className="card-error" style={{ marginTop: "var(--space-3)" }}>
            {cancellationError}
          </p>
        )}
      </div>
    </div>
  );
}
