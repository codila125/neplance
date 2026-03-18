export function ProposalDecisionSection({
  canReject,
  handleReject,
  isRejecting,
  rejectError,
  rejectReason,
  setRejectReason,
}) {
  return (
    <>
      {canReject && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h3
            style={{
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-2)",
            }}
          >
            Reject Proposal
          </h3>
          <div
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            <label
              htmlFor="rejectReason"
              style={{
                display: "block",
                marginBottom: "var(--space-2)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              Rejection Reason
            </label>
            <textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Share why you are rejecting this proposal"
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
              disabled={isRejecting}
            />
            {rejectError && (
              <p className="card-error" style={{ marginTop: "var(--space-2)" }}>
                {rejectError}
              </p>
            )}
            <div style={{ marginTop: "var(--space-3)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
