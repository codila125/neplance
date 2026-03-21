"use server";

import { revalidatePath } from "next/cache";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";

export async function createConversationFromProposalAction(proposalId) {
  await requireSession();

  const response = await apiServerRequest(`/api/chat/proposal/${proposalId}`, {
    method: "POST",
  });
  const conversation = response?.data || response;

  revalidatePath("/", "layout");
  revalidatePath("/messages");
  revalidatePath(`/proposals/${proposalId}`);

  return successResult(conversation);
}

export async function sendMessageAction(conversationId, formData) {
  await requireSession();

  const body = String(formData.get("body") || "").trim();
  let attachments = [];

  try {
    attachments = JSON.parse(String(formData.get("attachments") || "[]"));
  } catch {
    attachments = [];
  }

  if (!body && attachments.length === 0) {
    throw new Error("Message cannot be empty.");
  }

  const response = await apiServerRequest(
    `/api/chat/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ body, attachments }),
    },
  );

  revalidatePath("/", "layout");
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return successResult(response?.data || response);
}
