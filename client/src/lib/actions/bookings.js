"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession, requireVerifiedSession } from "@/lib/server/auth";

export async function createBookingFromProposalAction(proposalId) {
  await requireVerifiedSession();

  const response = await apiServerRequest(`/api/bookings/proposal/${proposalId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/proposals/${proposalId}`);

  return successResult(response?.data || response);
}

export async function generateBookingVisitOtpAction(bookingId) {
  await requireSession();

  const response = await apiServerRequest(`/api/bookings/${bookingId}/visit-otp`, {
    method: "PATCH",
  });

  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);

  return successResult(response?.data || response);
}

export async function verifyBookingVisitOtpAction(bookingId, otpCode) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/bookings/${bookingId}/visit-otp/verify`,
    {
      method: "PATCH",
      body: JSON.stringify({
        otpCode: typeof otpCode === "string" ? otpCode.trim() : "",
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);

  return successResult(response?.data || response);
}

export async function submitBookingQuoteAction(
  bookingId,
  quoteAmount,
  quoteNotes,
  quoteAttachments = [],
) {
  await requireVerifiedSession();

  const response = await apiServerRequest(`/api/bookings/${bookingId}/quote`, {
    method: "PATCH",
    body: JSON.stringify({
      quoteAmount: Number(quoteAmount),
      quoteNotes: typeof quoteNotes === "string" ? quoteNotes.trim() : "",
      quoteAttachments: Array.isArray(quoteAttachments)
        ? quoteAttachments.filter((attachment) => attachment?.url)
        : [],
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);

  return successResult(response?.data || response);
}
