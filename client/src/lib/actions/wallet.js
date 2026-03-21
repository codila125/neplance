"use server";

import { revalidatePath } from "next/cache";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";

export async function loadWalletFundsAction(amount) {
  await requireSession();

  const normalizedAmount = Number(amount?.amount ?? amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Please enter a valid load amount.");
  }

  const response = await apiServerRequest("/api/wallet/load", {
    method: "POST",
    body: JSON.stringify({
      amount: normalizedAmount,
      paymentMethod: amount?.paymentMethod,
      transactionId: amount?.transactionId,
      screenshot: amount?.screenshot,
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/wallet");

  return successResult(response?.data || response);
}

export async function requestWithdrawalAction(amount) {
  await requireSession();

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Please enter a valid withdrawal amount.");
  }

  const response = await apiServerRequest("/api/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify({
      amount: normalizedAmount,
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/wallet");

  return successResult(response?.data || response);
}
