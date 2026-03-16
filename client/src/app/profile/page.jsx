import { ProfilePageClient } from "@/features/profile/components/ProfilePageClient";
import { requireSession } from "@/lib/server/auth";
import { getMyJobsServer } from "@/lib/server/jobs";
import { getMyProposalsServer } from "@/lib/server/proposals";
import { checkDeleteEligibilityServer } from "@/lib/server/users";
import { JOB_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";

export default async function ProfilePage() {
  const { activeRole, user } = await requireSession();
  const isFreelancer = activeRole === "freelancer";
  const [deleteEligibility, jobs, proposals] = await Promise.all([
    checkDeleteEligibilityServer(),
    isFreelancer ? Promise.resolve([]) : getMyJobsServer(),
    isFreelancer ? getMyProposalsServer() : Promise.resolve([]),
  ]);

  const completedJobs = isFreelancer
    ? proposals
        .filter(
          (proposal) =>
            proposal.status === PROPOSAL_STATUS.ACCEPTED &&
            proposal.job &&
            proposal.job.status === JOB_STATUS.COMPLETED,
        )
        .map((proposal) => ({
          ...proposal.job,
          status: proposal.job.status,
          review: null,
        }))
    : jobs
        .filter((job) => job.status === JOB_STATUS.COMPLETED)
        .map((job) => ({ ...job, review: null }));

  return (
    <ProfilePageClient
      initialCompletedJobs={completedJobs}
      initialDeleteEligibility={deleteEligibility}
      initialUser={user}
    />
  );
}
