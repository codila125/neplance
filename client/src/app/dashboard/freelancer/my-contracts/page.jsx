import { ContractsListSection } from "@/features/contracts/components/ContractsListSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { listMyBookingsServer } from "@/lib/server/bookings";
import { listMyContractsServer } from "@/lib/server/contracts";

export default async function FreelancerMyContractsPage() {
  await requireDashboardRole("freelancer");
  const [contracts, bookings] = await Promise.all([
    listMyContractsServer(),
    listMyBookingsServer(),
  ]);

  return (
    <ContractsListSection
      contracts={contracts}
      bookings={bookings.filter((booking) => !booking.contract)}
      viewerRole="freelancer"
    />
  );
}
