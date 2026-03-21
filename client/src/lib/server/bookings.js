import { apiServerCall } from "@/lib/api/server";

export async function getBookingByIdServer(bookingId) {
  const data = await apiServerCall(`/api/bookings/${bookingId}`);
  return data?.data || null;
}

export async function getBookingByProposalServer(proposalId) {
  const data = await apiServerCall(`/api/bookings/proposal/${proposalId}`);
  return data?.data || null;
}
