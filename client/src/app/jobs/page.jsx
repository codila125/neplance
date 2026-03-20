import { JobsPageClient } from "@/features/jobs/components/JobsPageClient";
import { requireCurrentUser } from "@/lib/server/auth";
import { listOpenJobsServer } from "@/lib/server/jobs";
import { getMyProposalsServer } from "@/lib/server/proposals";
import { PROPOSAL_STATUS } from "@/shared/constants/statuses";

export default async function JobsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams(
    Object.entries(resolvedSearchParams || {}).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, item])
        : value
          ? [[key, value]]
          : [],
    ),
  ).toString();
  const [user, jobs] = await Promise.all([
    requireCurrentUser(),
    listOpenJobsServer(query),
  ]);
  const roleList = Array.isArray(user?.role)
    ? user.role
    : [user?.role].filter(Boolean);
  const proposals = roleList.includes("freelancer")
    ? await getMyProposalsServer()
    : [];
  const existingProposalByJobId = Object.fromEntries(
    proposals
      .filter((proposal) => proposal.status !== PROPOSAL_STATUS.WITHDRAWN)
      .map((proposal) => [
        String(proposal.job?._id || proposal.job),
        proposal._id,
      ]),
  );

  return (
    <JobsPageClient
      existingProposalByJobId={existingProposalByJobId}
      initialJobs={jobs}
      initialSearchParams={resolvedSearchParams || {}}
      initialUser={user}
    />
  );
}
