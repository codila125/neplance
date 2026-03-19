import { apiServerCall } from "@/lib/api/server";

export async function listVerificationQueueServer(status = "pending") {
  const data = await apiServerCall(
    `/api/admin/verification?status=${encodeURIComponent(status)}`,
  );
  return data?.data || [];
}

export async function listDisputesQueueServer(status = "all") {
  const data = await apiServerCall(
    `/api/admin/disputes?status=${encodeURIComponent(status)}`,
  );
  return data?.data || [];
}
