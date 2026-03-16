import { apiServerCall } from "@/lib/api/server";

export async function listNotificationsServer(limit = 20) {
  const data = await apiServerCall(`/api/notifications?limit=${limit}`);
  return data?.data || [];
}

export async function getNotificationSummaryServer() {
  const data = await apiServerCall("/api/notifications/summary");
  return data?.data || { unreadCount: 0 };
}
