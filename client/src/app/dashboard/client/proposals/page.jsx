import { ClientProposalsSection } from "@/features/dashboard/sections/ClientProposalsSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getClientProposalsByContractServer } from "@/lib/server/dashboard";

export default async function ClientProposalsPage() {
  await requireDashboardRole("client");
  const { contracts, proposalsByContract } =
    await getClientProposalsByContractServer();

  return (
    <ClientProposalsSection
      initialContracts={contracts}
      initialProposalsByContract={proposalsByContract}
    />
  );
}
