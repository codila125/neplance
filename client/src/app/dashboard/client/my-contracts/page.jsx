import { ContractsListSection } from "@/features/contracts/components/ContractsListSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { listMyContractsServer } from "@/lib/server/contracts";

export default async function ClientMyContractsPage() {
  await requireDashboardRole("client");
  const contracts = await listMyContractsServer();

  return <ContractsListSection contracts={contracts} viewerRole="client" />;
}
