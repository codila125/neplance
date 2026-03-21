"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProposalDecisionSection } from "@/features/proposals/components/ProposalDecisionSection";
import { ProposalResubmitSection } from "@/features/proposals/components/ProposalResubmitSection";
import { ProposalSummarySection } from "@/features/proposals/components/ProposalSummarySection";
import { createBookingFromProposalAction } from "@/lib/actions/bookings";
import { createConversationFromProposalAction } from "@/lib/actions/chat";
import {
  createProposalMutationAction,
  rejectProposalAction,
  updateProposalMutationAction,
} from "@/lib/actions/proposals";
import { Button } from "@/shared/components/UI";
import { BOOKING_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";

export function ProposalDetailPageClient({
  initialConversationId,
  initialBooking,
  initialContractId,
  initialProposal,
  initialUser,
}) {
  const router = useRouter();
  const user = initialUser;
  const [proposal, setProposal] = useState(initialProposal);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [booking, setBooking] = useState(initialBooking);
  const [contractId] = useState(initialContractId);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [chatError, setChatError] = useState("");
  const [resubmitData, setResubmitData] = useState({
    amount: initialProposal.amount?.toString() || "",
    pricingType: initialProposal.pricingType || "fixed_quote",
    coverLetter: initialProposal.coverLetter || "",
    deliveryDays: initialProposal.deliveryDays?.toString() || "",
    revisionsIncluded: initialProposal.revisionsIncluded?.toString() || "0",
    visitAvailableOn: initialProposal.visitAvailableOn
      ? new Date(initialProposal.visitAvailableOn).toISOString().slice(0, 10)
      : "",
    inspectionNotes: initialProposal.inspectionNotes || "",
    attachments: Array.isArray(initialProposal.attachments)
      ? initialProposal.attachments
      : [],
  });
  const [resubmitError, setResubmitError] = useState("");
  const [isEditing, startEditTransition] = useTransition();
  const [isRejecting, startRejectTransition] = useTransition();
  const [isResubmitting, startResubmitTransition] = useTransition();
  const [isStartingChat, startChatTransition] = useTransition();
  const [isCreatingBooking, startBookingTransition] = useTransition();

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

  const handleResubmitChange = (field, value) => {
    setResubmitData((previous) => ({ ...previous, [field]: value }));
  };

  const handleResubmit = async (event) => {
    event.preventDefault();
    setResubmitError("");

    if (
      resubmitData.pricingType !== "inspection_required" &&
      (!resubmitData.amount || Number(resubmitData.amount) <= 0)
    ) {
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

    const attachmentsArray = Array.isArray(resubmitData.attachments)
      ? resubmitData.attachments
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
          pricingType: resubmitData.pricingType,
          amount: Number(resubmitData.amount),
          coverLetter: resubmitData.coverLetter.trim(),
          deliveryDays: Number(resubmitData.deliveryDays),
          revisionsIncluded: Number(resubmitData.revisionsIncluded) || 0,
          visitAvailableOn: resubmitData.visitAvailableOn || undefined,
          inspectionNotes: resubmitData.inspectionNotes?.trim(),
          attachments: attachmentsArray,
        });
        const newId = result.data?._id;
        router.push(newId ? `/proposals/${newId}` : "/dashboard");
      } catch (error) {
        setResubmitError(error.message || "Failed to resubmit proposal");
      }
    });
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    setResubmitError("");

    if (
      resubmitData.pricingType !== "inspection_required" &&
      (!resubmitData.amount || Number(resubmitData.amount) <= 0)
    ) {
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

    const attachmentsArray = Array.isArray(resubmitData.attachments)
      ? resubmitData.attachments
      : [];
    const invalidUrl = attachmentsArray.find(
      (item) => !/^https?:\/\//i.test(item),
    );
    if (invalidUrl) {
      setResubmitError("Attachments must be valid URLs");
      return;
    }

    startEditTransition(async () => {
      try {
        const result = await updateProposalMutationAction(proposal._id, {
          job: proposal.job?._id || proposal.job,
          pricingType: resubmitData.pricingType,
          amount: Number(resubmitData.amount),
          coverLetter: resubmitData.coverLetter.trim(),
          deliveryDays: Number(resubmitData.deliveryDays),
          revisionsIncluded: Number(resubmitData.revisionsIncluded) || 0,
          visitAvailableOn: resubmitData.visitAvailableOn || undefined,
          inspectionNotes: resubmitData.inspectionNotes?.trim(),
          attachments: attachmentsArray,
        });

        setProposal((previous) => ({
          ...previous,
          ...result.data,
        }));
      } catch (error) {
        setResubmitError(error.message || "Failed to update proposal");
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

  const handleCreateBooking = async () => {
    setChatError("");
    startBookingTransition(async () => {
      try {
        const result = await createBookingFromProposalAction(proposal._id);
        if (result.data) {
          setBooking(result.data);
          router.push(`/bookings/${result.data._id}`);
        }
      } catch (error) {
        setChatError(error.message || "Failed to create booking");
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
  const canEdit = isFreelancer && proposal?.status === PROPOSAL_STATUS.PENDING;
  const canResubmit =
    isFreelancer && proposal?.status === PROPOSAL_STATUS.REJECTED;
  const canStartChat = isClient && !conversationId;
  const canOpenChat = Boolean(conversationId) && (isClient || isFreelancer);
  const canCreateContract =
    isClient &&
    proposal?.job?.jobType !== "physical" &&
    [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(
      proposal?.status,
    ) &&
    !contractId;
  const canCreateBooking =
    isClient &&
    proposal?.job?.jobType === "physical" &&
    !booking?._id &&
    !contractId &&
    [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(
      proposal?.status,
    );
  const canOpenBooking = Boolean(booking?._id);
  const canCreateContractFromBooking =
    isClient &&
    proposal?.job?.jobType === "physical" &&
    booking?.status === BOOKING_STATUS.QUOTED &&
    !contractId;
  const canViewContract = Boolean(contractId);

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
            {canViewContract ? (
              <Link
                href={`/contracts/${contractId}`}
                className="btn btn-secondary"
              >
                View Contract
              </Link>
            ) : null}
            {canCreateContract ? (
              <Link
                href={`/contracts/create?proposalId=${proposal._id}`}
                className="btn btn-secondary"
              >
                Create Contract
              </Link>
            ) : null}
            {canCreateBooking ? (
              <Button
                variant="secondary"
                disabled={isCreatingBooking}
                onClick={handleCreateBooking}
              >
                {isCreatingBooking ? "Creating Booking..." : "Create Booking"}
              </Button>
            ) : null}
            {canOpenBooking ? (
              <Link
                href={`/bookings/${booking._id}`}
                className="btn btn-secondary"
              >
                Open Booking
              </Link>
            ) : null}
            {canCreateContractFromBooking ? (
              <Link
                href={`/contracts/create?bookingId=${booking._id}`}
                className="btn btn-secondary"
              >
                Create Contract
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

          {canEdit && (
            <ProposalResubmitSection
              title="Edit Proposal"
              buttonLabel="Save Proposal"
              handleResubmit={handleEdit}
              handleResubmitChange={handleResubmitChange}
              isResubmitting={isEditing}
              isPhysicalJob={proposal?.job?.jobType === "physical"}
              resubmitData={resubmitData}
              resubmitError={resubmitError}
            />
          )}

          {canResubmit && (
            <ProposalResubmitSection
              title="Resubmit Proposal"
              buttonLabel="Resubmit Proposal"
              handleResubmit={handleResubmit}
              handleResubmitChange={handleResubmitChange}
              isResubmitting={isResubmitting}
              isPhysicalJob={proposal?.job?.jobType === "physical"}
              resubmitData={resubmitData}
              resubmitError={resubmitError}
            />
          )}

          <ProposalDecisionSection
            canReject={canReject}
            handleReject={handleReject}
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
