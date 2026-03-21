"use server";

import { revalidatePath } from "next/cache";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireAdminSession } from "@/lib/server/auth";

export async function reviewVerificationAction(userId, decision, reason = "") {
  await requireAdminSession();

  const response = await apiServerRequest(`/api/admin/verification/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      decision,
      reason: typeof reason === "string" ? reason.trim() : "",
    }),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pending-verification");
  revalidatePath("/admin/users");
  revalidatePath("/talent");
  revalidatePath(`/freelancers/${userId}`);
  revalidatePath("/profile");

  return successResult(response?.data || response);
}

export async function reviewDisputeAction(
  disputeId,
  decision,
  resolutionNotes = "",
) {
  await requireAdminSession();

  const response = await apiServerRequest(`/api/admin/disputes/${disputeId}`, {
    method: "PATCH",
    body: JSON.stringify({
      decision,
      resolutionNotes:
        typeof resolutionNotes === "string" ? resolutionNotes.trim() : "",
    }),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/disputes");
  revalidatePath("/dashboard");
  revalidatePath("/contracts");
  revalidatePath("/wallet");

  return successResult(response?.data || response);
}
