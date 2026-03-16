"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";

export async function markNotificationReadAction(notificationId, redirectPath) {
  await requireSession();

  await apiServerRequest(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

  revalidatePath("/", "layout");
  revalidatePath("/notifications");

  if (redirectPath) {
    redirect(redirectPath);
  }

  return successResult();
}

export async function markAllNotificationsReadAction() {
  await requireSession();

  await apiServerRequest("/api/notifications/read-all", {
    method: "PATCH",
  });

  revalidatePath("/", "layout");
  revalidatePath("/notifications");

  return successResult();
}
