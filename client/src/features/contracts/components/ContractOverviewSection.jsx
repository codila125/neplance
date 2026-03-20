import { CONTRACT_FUNDING_STATUS } from "@/shared/constants/statuses";
import { formatStatus } from "@/shared/utils/job";
import { formatContractDateTime } from "./contractDetailUtils";

export function ContractOverviewSection({
  contract,
  freelancerRejectedContract,
  remainingFundedBalance,
}) {
  return (
    <>
      <div className="grid gap-4 mb-6">
        <div>
          <strong>Contract type:</strong> {formatStatus(contract.contractType)}
        </div>
        <div>
          <strong>Total contract value:</strong> {contract.currency || "NPR"}{" "}
          {Number(contract.totalAmount || 0).toLocaleString()}
        </div>
        <div>
          <strong>Funding status:</strong>{" "}
          {formatStatus(
            contract.fundingStatus || CONTRACT_FUNDING_STATUS.UNFUNDED,
          )}
        </div>
        <div>
          <strong>Funded amount:</strong> {contract.currency || "NPR"}{" "}
          {Number(contract.fundedAmount || 0).toLocaleString()}
        </div>
        <div>
          <strong>Released amount:</strong> {contract.currency || "NPR"}{" "}
          {Number(contract.releasedAmount || 0).toLocaleString()}
        </div>
        <div>
          <strong>Refunded amount:</strong> {contract.currency || "NPR"}{" "}
          {Number(contract.refundedAmount || 0).toLocaleString()}
        </div>
        <div>
          <strong>Still held:</strong> {contract.currency || "NPR"}{" "}
          {Number(remainingFundedBalance || 0).toLocaleString()}
        </div>
        {contract.job?.budget ? (
          <div>
            <strong>Original job budget:</strong>{" "}
            {contract.job.budget.currency || "NPR"}{" "}
            {Number(contract.job.budget.min || 0).toLocaleString()}
            {contract.job.budget.max
              ? ` - ${contract.job.budget.currency || "NPR"} ${Number(contract.job.budget.max).toLocaleString()}`
              : ""}
          </div>
        ) : null}
        <div>
          <strong>Client signed:</strong>{" "}
          {contract.clientSignature?.signedAt ? "Yes" : "No"}
        </div>
        <div>
          <strong>Freelancer signed:</strong>{" "}
          {contract.freelancerSignature?.signedAt ? "Yes" : "No"}
        </div>
        {contract.freelancerSignature?.rejectedAt ? (
          <div>
            <strong>Freelancer requested changes:</strong>{" "}
            {formatContractDateTime(contract.freelancerSignature.rejectedAt)}
          </div>
        ) : null}
        {contract.completedAt ? (
          <div>
            <strong>Completed at:</strong>{" "}
            {formatContractDateTime(contract.completedAt)}
          </div>
        ) : null}
      </div>

      {contract.description ? (
        <div className="mb-6">
          <h3 className="mb-2">Scope</h3>
          <p className="text-secondary mb-0">{contract.description}</p>
        </div>
      ) : null}

      {contract.terms ? (
        <div className="mb-6">
          <h3 className="mb-2">Terms</h3>
          <p className="text-secondary mb-0">{contract.terms}</p>
        </div>
      ) : null}

      {freelancerRejectedContract ? (
        <div className="card-sm mb-6">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="badge">Revision Requested</span>
            <span className="text-sm text-muted">
              {formatContractDateTime(contract.freelancerSignature.rejectedAt)}
            </span>
          </div>
          <p className="text-secondary mb-0">
            {contract.freelancerSignature.rejectionReason ||
              "The freelancer rejected the current draft. The proposal is still active, and the client can edit this contract and resend it."}
          </p>
        </div>
      ) : null}
    </>
  );
}
