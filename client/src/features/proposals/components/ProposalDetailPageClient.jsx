"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProposalDecisionSection } from "@/features/proposals/components/ProposalDecisionSection";
import { ProposalResubmitSection } from "@/features/proposals/components/ProposalResubmitSection";
import { ProposalSummarySection } from "@/features/proposals/components/ProposalSummarySection";
import { createConversationFromProposalAction } from "@/lib/actions/chat";
import {
  acceptProposalAction,
  createProposalMutationAction,
  rejectProposalAction,
} from "@/lib/actions/proposals";
import { Button } from "@/shared/components/UI";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";

export function ProposalDetailPageClient({
  initialConversationId,
  initialProposal,
  initialUser,
}) {
  const router = useRouter();
  const user = initialUser;
  const [proposal, setProposal] = useState(initialProposal);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [chatError, setChatError] = useState("");
  const [resubmitData, setResubmitData] = useState({
    amount: initialProposal.amount?.toString() || "",
    coverLetter: initialProposal.coverLetter || "",
    deliveryDays: initialProposal.deliveryDays?.toString() || "",
    revisionsIncluded: initialProposal.revisionsIncluded?.toString() || "0",
    attachments: Array.isArray(initialProposal.attachments)
      ? initialProposal.attachments.join(", ")
      : "",
  });
  const [resubmitError, setResubmitError] = useState("");
  const [isRejecting, startRejectTransition] = useTransition();
  const [isAccepting, startAcceptTransition] = useTransition();
  const [isResubmitting, startResubmitTransition] = useTransition();
  const [isStartingChat, startChatTransition] = useTransition();

  const handleReject = async () => {
    setRejectError("");
    startRejectTransition(async () => {
      try {
        const result = await rejectProposalAction(
          proposal._id,
          rejectReason.trim() || undefined,
        );
        setProposal(result.data);
        setRejectReason("");
      } catch (error) {
        setRejectError(error.message || "Failed to reject proposal");
      }
    });
  };

  const handleAccept = async () => {
    setAcceptError("");
    startAcceptTransition(async () => {
      try {
        const result = await acceptProposalAction(proposal._id);
        setProposal(
          result.data || { ...proposal, status: PROPOSAL_STATUS.ACCEPTED },
        );
      } catch (error) {
        setAcceptError(error.message || "Failed to accept proposal");
      }
    });
  };

  const handleResubmitChange = (field, value) => {
    setResubmitData((previous) => ({ ...previous, [field]: value }));
  };

  const handleResubmit = async (event) => {
    event.preventDefault();
    setResubmitError("");

    if (!resubmitData.amount || Number(resubmitData.amount) <= 0) {
      setResubmitError("Please enter a valid amount");
      return;
    }
    if (resubmitData.coverLetter.trim().length < 5) {
      setResubmitError("Cover letter must be at least 5 characters");
      return;
    }
    if (!resubmitData.deliveryDays || Number(resubmitData.deliveryDays) <= 0) {
      setResubmitError("Please enter valid delivery days");
      return;
    }

    const attachmentsArray = resubmitData.attachments
      ? resubmitData.attachments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const invalidUrl = attachmentsArray.find(
      (item) => !/^https?:\/\//i.test(item),
    );
    if (invalidUrl) {
      setResubmitError("Attachments must be valid URLs");
      return;
    }

    startResubmitTransition(async () => {
      try {
        const result = await createProposalMutationAction({
          job: proposal.job?._id || proposal.job,
          amount: Number(resubmitData.amount),
          coverLetter: resubmitData.coverLetter.trim(),
          deliveryDays: Number(resubmitData.deliveryDays),
          revisionsIncluded: Number(resubmitData.revisionsIncluded) || 0,
          attachments: attachmentsArray,
        });
        const newId = result.data?._id;
        router.push(newId ? `/proposals/${newId}` : "/dashboard");
      } catch (error) {
        setResubmitError(error.message || "Failed to resubmit proposal");
      }
    });
  };

  const handleStartChat = async () => {
    setChatError("");
    startChatTransition(async () => {
      try {
        const result = await createConversationFromProposalAction(proposal._id);
        const nextConversationId = result.data?._id;

        if (nextConversationId) {
          setConversationId(nextConversationId);
          router.push(`/messages/${nextConversationId}`);
        }
      } catch (error) {
        setChatError(error.message || "Failed to start conversation");
      }
    });
  };

  const currentUserId = user?.id || user?._id;
  const freelancerId =
    proposal?.freelancer?._id || proposal?.freelancer || proposal?.freelancerId;
  const creatorId =
    proposal?.job?.creatorAddress?._id || proposal?.job?.creatorAddress;
  const jobRoles = Array.isArray(proposal?.job?.parties)
    ? proposal.job.parties
    : [];
  const isCreatorParty = jobRoles.some(
    (party) =>
      party.role === "CREATOR" &&
      String(party.address) === String(currentUserId),
  );
  const isClient =
    currentUserId &&
    (String(creatorId) === String(currentUserId) || isCreatorParty);
  const isFreelancer =
    currentUserId && String(freelancerId) === String(currentUserId);
  const canReject = isClient && proposal?.status === PROPOSAL_STATUS.PENDING;
  const canAccept = isClient && proposal?.status === PROPOSAL_STATUS.PENDING;
  const canResubmit =
    isFreelancer && proposal?.status === PROPOSAL_STATUS.REJECTED;
  const canStartChat = isClient && !conversationId;
  const canOpenChat = Boolean(conversationId) && (isClient || isFreelancer);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div style={{ marginBottom: "var(--space-4)" }}>
          <div className="flex gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => router.back()}>
              Back
            </Button>
            {canOpenChat ? (
              <Link
                href={`/messages/${conversationId}`}
                className="btn btn-secondary"
              >
                Open Chat
              </Link>
            ) : null}
            {canStartChat ? (
              <Button
                variant="secondary"
                disabled={isStartingChat}
                onClick={handleStartChat}
              >
                {isStartingChat ? "Starting Chat..." : "Start Chat"}
              </Button>
            ) : null}
          </div>
          {chatError ? (
            <p className="text-error text-sm mt-2 mb-0">{chatError}</p>
          ) : null}
        </div>

        <div className="card">
          <ProposalSummarySection proposal={proposal} />

          {canResubmit && (
            <ProposalResubmitSection
              handleResubmit={handleResubmit}
              handleResubmitChange={handleResubmitChange}
              isResubmitting={isResubmitting}
              resubmitData={resubmitData}
              resubmitError={resubmitError}
            />
          )}

          <ProposalDecisionSection
            acceptError={acceptError}
            canAccept={canAccept}
            canReject={canReject}
            handleAccept={handleAccept}
            handleReject={handleReject}
            isAccepting={isAccepting}
            isRejecting={isRejecting}
            rejectError={rejectError}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
          />
        </div>
      </div>
    </div>
  );
}
