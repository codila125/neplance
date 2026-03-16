"use server";

import { revalidatePath } from "next/cache";
import { successResult } from "@/lib/actions/result";
import { logoutAction } from "@/lib/actions/session";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";

export async function deleteAccountAction() {
  await requireSession();

  await apiServerRequest("/api/users/me", {
    method: "DELETE",
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  await logoutAction();
  return successResult();
}
