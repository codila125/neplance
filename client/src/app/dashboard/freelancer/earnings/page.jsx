import { WalletOverviewSection } from "@/features/wallet/components/WalletOverviewSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getMyWalletServer } from "@/lib/server/wallet";

export default async function FreelancerEarningsPage() {
  await requireDashboardRole("freelancer");
  const walletData = await getMyWalletServer();

  return <WalletOverviewSection initialData={walletData} mode="freelancer" />;
}
