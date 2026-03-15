import { ClientJobsSection } from "@/features/dashboard/sections/ClientJobsSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getClientContractsServer } from "@/lib/server/dashboard";

export default async function ClientMyJobsPage() {
  const { user } = await requireDashboardRole("client");
  const contracts = await getClientContractsServer();

  return <ClientJobsSection initialContracts={contracts} initialUser={user} />;
}
