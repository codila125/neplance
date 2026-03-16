import { JobsPageClient } from "@/features/jobs/components/JobsPageClient";
import { requireCurrentUser } from "@/lib/server/auth";
import { listOpenJobsServer } from "@/lib/server/jobs";

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

  return (
    <JobsPageClient
      initialJobs={jobs}
      initialSearchParams={resolvedSearchParams || {}}
      initialUser={user}
    />
  );
}
