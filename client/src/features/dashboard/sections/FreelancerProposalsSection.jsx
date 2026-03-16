"use client";

import { useState } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { ProposalCard } from "@/features/dashboard/components/JobCard";
import { withdrawProposalAction } from "@/lib/actions/proposals";

export function FreelancerProposalsSection({ initialProposals }) {
  const [proposals, setProposals] = useState(initialProposals);

  const handleWithdrawProposal = async (proposal) => {
    if (!confirm("Are you sure you want to withdraw this proposal?")) return;

    try {
      const result = await withdrawProposalAction(proposal._id);
      setProposals((prev) =>
        prev.map((item) => (item._id === proposal._id ? result.data : item)),
      );
    } catch (err) {
      alert(err.message || "Failed to withdraw proposal");
    }
  };

  return proposals.length > 0 ? (
    <div className="cards-list">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal._id}
          proposal={proposal}
          onWithdraw={handleWithdrawProposal}
        />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No Proposals"
      description="Submit proposals on available contracts to see them here."
    />
  );
}
