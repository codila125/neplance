import { notFound, redirect } from "next/navigation";
import { ContractCreatePageClient } from "@/features/contracts/components/ContractCreatePageClient";
import { requireSession } from "@/lib/server/auth";
import { getBookingByIdServer } from "@/lib/server/bookings";
import { getContractByIdServer } from "@/lib/server/contracts";
import { getProposalByIdServer } from "@/lib/server/proposals";
import { getMyWalletServer } from "@/lib/server/wallet";
import { CONTRACT_STATUS } from "@/shared/constants/statuses";

export default async function EditContractPage({ params }) {
  const { activeRole, user } = await requireSession();
  if (activeRole !== "client") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const contract = await getContractByIdServer(id);

  if (!contract) {
    notFound();
  }

  const isContractOwner =
    String(contract.client?._id || contract.client) ===
    String(user.id || user._id);
  if (!isContractOwner) {
    redirect(`/contracts/${id}`);
  }

  if (contract.status !== CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE) {
    redirect(`/contracts/${id}`);
  }

  const proposalId = contract.proposal?._id || contract.proposal;
  const [proposal, walletData, booking] = await Promise.all([
    contract.proposal?.job
      ? contract.proposal
      : getProposalByIdServer(proposalId),
    getMyWalletServer(),
    contract.booking?._id || contract.booking
      ? getBookingByIdServer(contract.booking?._id || contract.booking)
      : Promise.resolve(null),
  ]);

  if (!proposal) {
    notFound();
  }

  return (
    <ContractCreatePageClient
      proposal={proposal}
      walletData={walletData}
      contract={contract}
      booking={booking}
    />
  );
}
