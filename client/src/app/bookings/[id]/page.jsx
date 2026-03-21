import { notFound } from "next/navigation";
import { BookingDetailPageClient } from "@/features/bookings/components/BookingDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getBookingByIdServer } from "@/lib/server/bookings";

export default async function BookingDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const booking = await getBookingByIdServer(id);

  if (!booking) {
    notFound();
  }

  return (
    <BookingDetailPageClient
      booking={booking}
      currentUserId={user.id || user._id}
    />
  );
}
