import { ClientPostJobSection } from "@/features/dashboard/sections/ClientPostJobSection";
import { requireDashboardRole } from "@/lib/server/auth";

export default async function ClientPostJobPage() {
  await requireDashboardRole("client");
  return <ClientPostJobSection />;
}
