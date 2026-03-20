import {
  CANCELLATION_STATUS,
  CONTRACT_STATUS,
} from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";

export function ContractCancellationSection({
  cancellation,
  cancellationReason,
  canEditPendingContract,
  canRequestCancellation,
  canRespondCancellation,
  contractStatus,
  handleRequestCancellation,
  handleRespondCancellation,
  hasPendingCancellation,
  isCancellationInitiator,
  isPending,
  onCancellationReasonChange,
}) {
  const isPendingFreelancerSignature =
    contractStatus === CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE;

  return (
    <div className="mb-6">
      <h3 className="mb-3">Cancellation</h3>
      <div className="card-sm">
        {isPendingFreelancerSignature ? (
          <p className="text-muted mb-0">
            {canEditPendingContract
              ? "Use the pending contract actions below to cancel this draft before signature. Standard cancellation requests apply after the contract becomes active."
              : "This contract is still pending signature. Standard cancellation requests apply after activation."}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="badge">
                {formatStatus(cancellation.status || CANCELLATION_STATUS.NONE)}
              </span>
              {cancellation.initiatedRole ? (
                <span className="text-sm text-muted">
                  Initiated by {cancellation.initiatedRole.toLowerCase()}
                </span>
              ) : null}
            </div>
            {cancellation.reason ? (
              <p className="text-secondary mb-3">{cancellation.reason}</p>
            ) : null}
            {canRequestCancellation ? (
              <>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Explain why you want to cancel this contract"
                  value={cancellationReason}
                  onChange={(event) =>
                    onCancellationReasonChange(event.target.value)
                  }
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRequestCancellation}
                    disabled={isPending}
                  >
                    {isPending ? "Requesting..." : "Request Cancellation"}
                  </button>
                </div>
              </>
            ) : null}
            {canRespondCancellation ? (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRespondCancellation("accept")}
                  disabled={isPending}
                >
                  {isPending ? "Processing..." : "Accept"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRespondCancellation("reject")}
                  disabled={isPending}
                >
                  Reject
                </button>
              </div>
            ) : null}
            {hasPendingCancellation && isCancellationInitiator ? (
              <p className="text-muted mt-3 mb-0">
                Waiting for the other party to respond to your cancellation
                request.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
