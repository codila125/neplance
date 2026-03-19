import { notFound, redirect } from "next/navigation";
import { ContractCreatePageClient } from "@/features/contracts/components/ContractCreatePageClient";
import { requireSession } from "@/lib/server/auth";
import { getContractByProposalServer } from "@/lib/server/contracts";
import { getProposalByIdServer } from "@/lib/server/proposals";
import { getMyWalletServer } from "@/lib/server/wallet";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";

export default async function CreateContractPage({ searchParams }) {
  const { activeRole } = await requireSession();
  if (activeRole !== "client") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const proposalId = resolvedSearchParams?.proposalId;

  if (!proposalId) {
    notFound();
  }

  const [proposal, existingContract, walletData] = await Promise.all([
    getProposalByIdServer(proposalId),
    getContractByProposalServer(proposalId),
    getMyWalletServer(),
  ]);

  if (!proposal) {
    notFound();
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

  return (
    <ContractCreatePageClient proposal={proposal} walletData={walletData} />
  );
}
