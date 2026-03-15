import { FreelancerOngoingJobsSection } from "@/features/dashboard/sections/FreelancerOngoingJobsSection";
import { requireDashboardRole } from "@/lib/server/auth";
import { getFreelancerOngoingJobsServer } from "@/lib/server/dashboard";

export default async function FreelancerOngoingJobsPage() {
  const { user } = await requireDashboardRole("freelancer");
  const ongoingJobs = await getFreelancerOngoingJobsServer();

  return (
    <FreelancerOngoingJobsSection
      initialJobs={ongoingJobs}
      initialUser={user}
    />
  );
}
