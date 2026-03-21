import Link from "next/link";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { formatStatus } from "@/shared/utils/job";

export function ContractsListSection({
  contracts,
  bookings = [],
  viewerRole = "client",
}) {
  if (!contracts.length && !bookings.length) {
    return (
      <EmptyState
        title="No Contracts Yet"
        description="Contracts and physical bookings you create or sign will appear here."
      />
    );
  }

  return (
    <div className="cards-list">
      {bookings.map((booking) => {
        const otherParty =
          viewerRole === "client" ? booking.freelancer : booking.client;
        const otherPartyLabel =
          otherParty?.name || otherParty?.email || "Unknown User";

        return (
          <article
            key={`booking-${booking._id}`}
            className="card"
            style={{
              border: "1px solid var(--color-primary)",
              boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-primary) 25%, transparent)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex gap-2 flex-wrap mb-2">
                  <span className="badge badge-warning">Physical Booking</span>
                  <span className="badge">{formatStatus(booking.status)}</span>
                </div>
                <h3 className="mb-2">{booking.job?.title || "Physical Booking"}</h3>
                <p className="text-muted mb-0">
                  Waiting for inspection quote before contract creation
                </p>
              </div>
            </div>

            <div className="grid gap-2 mb-4 text-sm text-muted">
              <div>
                {viewerRole === "client" ? "Freelancer" : "Client"}:{" "}
                {otherPartyLabel}
              </div>
              <div>
                Booking date:{" "}
                {booking.scheduledFor
                  ? new Date(booking.scheduledFor).toLocaleDateString("en-NP")
                  : "Not scheduled yet"}
              </div>
              <div>
                Visit required: {booking.requiresVisit ? "Yes" : "No"}
              </div>
              {booking.quoteAmount ? (
                <div>
                  Freelancer quote: NPR{" "}
                  {Number(booking.quoteAmount || 0).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/bookings/${booking._id}`}
                className="btn btn-secondary btn-sm"
              >
                Open Booking
              </Link>
              {booking.job?._id ? (
                <Link
                  href={`/jobs/${booking.job._id}`}
                  className="btn btn-ghost btn-sm"
                >
                  View Job
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}

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
