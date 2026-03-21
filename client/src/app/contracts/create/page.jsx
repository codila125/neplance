import { notFound, redirect } from "next/navigation";
import { ContractCreatePageClient } from "@/features/contracts/components/ContractCreatePageClient";
import { requireSession } from "@/lib/server/auth";
import { getBookingByIdServer } from "@/lib/server/bookings";
import { getContractByProposalServer } from "@/lib/server/contracts";
import { getProposalByIdServer } from "@/lib/server/proposals";
import { getMyWalletServer } from "@/lib/server/wallet";
import { BOOKING_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";

export default async function CreateContractPage({ searchParams }) {
  const { activeRole } = await requireSession();
  if (activeRole !== "client") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const proposalId = resolvedSearchParams?.proposalId;
  const bookingId = resolvedSearchParams?.bookingId;

  if (!proposalId && !bookingId) {
    notFound();
  }

  if (bookingId) {
    const [booking, walletData] = await Promise.all([
      getBookingByIdServer(bookingId),
      getMyWalletServer(),
    ]);

    if (!booking) {
      notFound();
    }

    if (booking.contract?._id || booking.contract) {
      redirect(`/contracts/${booking.contract?._id || booking.contract}`);
    }

    if (booking.status !== BOOKING_STATUS.QUOTED) {
      redirect(`/bookings/${bookingId}`);
    }

    return (
      <ContractCreatePageClient
        booking={booking}
        proposal={booking.proposal}
        walletData={walletData}
      />
    );
  }

  const [proposal, existingContract, walletData] = await Promise.all([
    getProposalByIdServer(proposalId),
    getContractByProposalServer(proposalId),
    getMyWalletServer(),
  ]);

  if (!proposal) {
    notFound();
  }

  if (proposal.job?.jobType === "physical") {
    redirect(`/proposals/${proposalId}`);
  }

  if (existingContract?._id) {
    redirect(`/contracts/${existingContract._id}`);
  }

  if (
    ![PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(
      proposal.status,
    )
  ) {
    redirect(`/proposals/${proposalId}`);
  }

  return <ContractCreatePageClient proposal={proposal} walletData={walletData} />;
}
