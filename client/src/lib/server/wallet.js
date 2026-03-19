import { apiServerCall } from "@/lib/api/server";

export async function getMyWalletServer() {
  const data = await apiServerCall("/api/wallet");
  return data?.data || null;
}
