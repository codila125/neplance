import { apiServerCall } from "@/lib/api/server";

export async function getChainBlocksServer(page = 1, limit = 10) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const data = await apiServerCall(
    `/api/blockchain/chain?page=${safePage}&limit=${safeLimit}`,
  );

  return {
    data: data?.data || [],
    page: data?.page || safePage,
    pages: data?.pages || 1,
    total: data?.total || 0,
  };
}
