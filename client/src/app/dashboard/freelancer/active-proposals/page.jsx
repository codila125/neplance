import { FreelancerProposalsSection } from "@/features/dashboard/sections/FreelancerProposalsSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getFreelancerActiveProposalsServer } from "@/lib/server/dashboard";

export default async function FreelancerActiveProposalsPage() {
  await requireDashboardRole("freelancer");
  const proposals = await getFreelancerActiveProposalsServer();

  return <FreelancerProposalsSection initialProposals={proposals} />;
}
