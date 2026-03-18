import Link from "next/link";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { formatStatus } from "@/shared/utils/job";

export function ContractsListSection({ contracts, viewerRole = "client" }) {
  if (!contracts.length) {
    return (
      <EmptyState
        title="No Contracts Yet"
        description="Contracts you create or sign will appear here."
      />
    );
  }

  return (
    <div className="cards-list">
      {contracts.map((contract) => {
        const otherParty =
          viewerRole === "client" ? contract.freelancer : contract.client;
        const otherPartyLabel =
          otherParty?.name || otherParty?.email || "Unknown User";

        return (
          <article key={contract._id} className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="mb-2">{contract.title}</h3>
                <p className="text-muted mb-0">
                  {contract.job?.title || "Contract"}
                </p>
              </div>
              <span className="badge badge-primary">
                {formatStatus(contract.status)}
              </span>
            </div>

            <div className="grid gap-2 mb-4 text-sm text-muted">
              <div>
                {viewerRole === "client" ? "Freelancer" : "Client"}:{" "}
                {otherPartyLabel}
              </div>
              <div>Contract type: {formatStatus(contract.contractType)}</div>
              <div>
                Total value: {contract.currency || "NPR"}{" "}
                {Number(contract.totalAmount || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/contracts/${contract._id}`}
                className="btn btn-secondary btn-sm"
              >
                View Contract
              </Link>
              {contract.job?._id ? (
                <Link
                  href={`/jobs/${contract.job._id}`}
                  className="btn btn-ghost btn-sm"
                >
                  View Job
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
