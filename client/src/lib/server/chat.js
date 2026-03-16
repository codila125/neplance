import { apiServerCall, apiServerRequest } from "@/lib/api/server";

export async function listConversationsServer() {
  const data = await apiServerCall("/api/chat");
  return data?.data || [];
}

export async function getChatSummaryServer() {
  const data = await apiServerCall("/api/chat/summary");
  return data?.data || { unreadCount: 0 };
}

export async function getConversationByProposalServer(proposalId) {
  const data = await apiServerCall(`/api/chat/proposal/${proposalId}`);
  return data?.data || null;
}

export async function getConversationByIdServer(conversationId) {
  const data = await apiServerCall(`/api/chat/${conversationId}`);
  return data?.data || null;
}

export async function getConversationMessagesServer(conversationId) {
  const data = await apiServerCall(`/api/chat/${conversationId}/messages`);
  return data?.data || [];
}

export async function markConversationReadServer(conversationId) {
  const data = await apiServerRequest(`/api/chat/${conversationId}/read`, {
    method: "PATCH",
  });
  return data?.data || null;
}
