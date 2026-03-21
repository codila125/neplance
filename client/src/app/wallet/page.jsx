import { WalletOverviewSection } from "@/features/wallet/components/WalletOverviewSection";
import { requireSession } from "@/lib/server/auth";
import { getMyWalletServer } from "@/lib/server/wallet";

export default async function WalletPage() {
  const { activeRole } = await requireSession();
  const walletData = await getMyWalletServer();

  return (
    <WalletOverviewSection
      initialData={walletData}
      mode={activeRole === "client" ? "client" : "freelancer"}
    />
  );
}
