"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";

export function ClientProposalsSection({
  initialContracts,
  initialProposalsByContract,
}) {
  const pendingProposals = useMemo(
    () =>
      initialContracts.flatMap((contract) =>
        (initialProposalsByContract[contract._id] || []).map((proposal) => ({
          ...proposal,
          _contract: contract,
        })),
      ),
    [initialContracts, initialProposalsByContract],
  );

  if (pendingProposals.length === 0) {
    return (
      <EmptyState
        title={
          initialContracts.length === 0
            ? "No Contracts Yet"
            : "No Proposals Yet"
        }
        description={
          initialContracts.length === 0
            ? "Create a contract to start receiving proposals."
            : "Freelancers will appear here once they submit proposals."
        }
      />
    );
  }

  return (
    <div className="cards-list">
      {pendingProposals.map((proposal) => {
        const freelancerLabel =
          proposal.freelancer?.name ||
          proposal.freelancer?.email ||
          "Unknown Freelancer";
        const freelancerEmail = proposal.freelancer?.email;
        const contractTitle =
          proposal.job?.title ||
          proposal._contract?.title ||
          "Untitled Contract";
        const contractDescription =
          proposal.job?.description || proposal._contract?.description || "";
        const hasActiveContract = Boolean(
          proposal.job?.activeContract || proposal._contract?.activeContract,
        );
        const canCreateContract =
          proposal.job?.jobType !== "physical" &&
          [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(
            proposal.status,
          ) && !hasActiveContract;

        return (
          <article key={proposal._id} className="job-card">
            <div className="job-card-header">
              <div className="job-card-avatar">
                {freelancerLabel.charAt(0).toUpperCase()}
              </div>
              <div className="job-card-meta">
                <span className="job-card-client">{freelancerLabel}</span>
              </div>
              <span
                className={`status-badge status-${proposal.status?.toLowerCase()}`}
              >
                {proposal.status || "Unknown"}
              </span>
            </div>
            <div className="job-card-content">
              <h3 className="job-card-title">{contractTitle}</h3>
              {contractDescription && (
                <p className="job-card-description">
                  {contractDescription.length > 160
                    ? `${contractDescription.slice(0, 160)}...`
                    : contractDescription}
                </p>
              )}
              <p className="job-card-description">
                {freelancerEmail
                  ? `Email: ${freelancerEmail}`
                  : "Email not shared"}
              </p>
              <p className="job-card-description">
                Amount: NPR {proposal.amount?.toLocaleString() || "N/A"}
              </p>
            </div>
            <div className="job-card-footer">
              <div className="job-card-budget-wrapper">
                <span className="job-card-budget-label">Status</span>
                <span className="job-card-budget">
                  {proposal.status || "Unknown"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Link
                  href={`/proposals/${proposal._id}`}
                  className="btn btn-ghost btn-sm"
                >
                  View Details
                </Link>
                {canCreateContract && (
                  <Link
                    href={`/contracts/create?proposalId=${proposal._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Create Contract
                  </Link>
                )}
                {proposal.job?.jobType === "physical" && !hasActiveContract ? (
                  <Link
                    href={`/proposals/${proposal._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Manage Booking
                  </Link>
                ) : null}
                {proposal.status === PROPOSAL_STATUS.ACCEPTED &&
                hasActiveContract ? (
                  <span className="badge badge-success">Contract Selected</span>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
