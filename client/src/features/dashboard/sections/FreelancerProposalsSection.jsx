"use client";

import { useState } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { ProposalCard } from "@/features/dashboard/components/JobCard";
import { withdrawProposalAction } from "@/lib/actions/proposals";
import { ActionModal } from "@/shared/components/ActionModal";

export function FreelancerProposalsSection({ initialProposals }) {
  const [proposals, setProposals] = useState(initialProposals);
  const [proposalToWithdraw, setProposalToWithdraw] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    title: "Confirm",
    message: "",
    hideCancel: false,
  });
  const [modalIntent, setModalIntent] = useState("info");

  const handleConfirmWithdraw = async () => {
    if (modalIntent !== "withdraw" || !proposalToWithdraw) {
      setModalState((previous) => ({ ...previous, open: false }));
      return;
    }
    try {
      const result = await withdrawProposalAction(proposalToWithdraw._id);
      setProposals((prev) =>
        prev.map((item) =>
          item._id === proposalToWithdraw._id ? result.data : item,
        ),
      );
      setProposalToWithdraw(null);
      setModalState((previous) => ({ ...previous, open: false }));
    } catch (err) {
      setModalIntent("info");
      setModalState({
        open: true,
        title: "Notice",
        message: err.message || "Failed to withdraw proposal",
        hideCancel: true,
      });
    }
  };

  const handleWithdrawProposal = async (proposal) => {
    setProposalToWithdraw(proposal);
    setModalIntent("withdraw");
    setModalState({
      open: true,
      title: "Confirm",
      message: "Are you sure you want to withdraw this proposal?",
      hideCancel: false,
    });
  };

  return proposals.length > 0 ? (
    <>
      <div className="cards-list">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal._id}
            proposal={proposal}
            onWithdraw={handleWithdrawProposal}
          />
        ))}
      </div>
      <ActionModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        confirmLabel="OK"
        cancelLabel="Cancel"
        hideCancel={modalState.hideCancel}
        onConfirm={handleConfirmWithdraw}
        onClose={() => {
          setProposalToWithdraw(null);
          setModalIntent("info");
          setModalState((previous) => ({ ...previous, open: false }));
        }}
      />
    </>
  ) : (
    <EmptyState
      title="No Proposals"
      description="Submit proposals on available contracts to see them here."
    />
  );
}
