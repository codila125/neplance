import { notFound } from "next/navigation";
import { JobDetailPageClient } from "@/features/jobs/components/JobDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getJobByIdServer } from "@/lib/server/jobs";

export default async function JobDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const job = await getJobByIdServer(id);

  if (!job) {
    notFound();
  }

  return <JobDetailPageClient initialJob={job} initialUser={user} />;
}
