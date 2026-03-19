import { WalletOverviewSection } from "@/features/wallet/components/WalletOverviewSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getMyWalletServer } from "@/lib/server/wallet";

export default async function ClientWalletPage() {
  await requireDashboardRole("client");
  const walletData = await getMyWalletServer();

  return <WalletOverviewSection initialData={walletData} mode="client" />;
}
