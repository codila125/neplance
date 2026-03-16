import { notFound, redirect } from "next/navigation";
import { EditJobPageClient } from "@/features/jobs/components/EditJobPageClient";
import { requireSession } from "@/lib/server/auth";
import { getJobByIdServer } from "@/lib/server/jobs";
import { JOB_STATUS } from "@/shared/constants/statuses";

export default async function EditJobPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const job = await getJobByIdServer(id);

  if (!job) {
    notFound();
  }

  const userId = user.id || user._id;
  const creatorId = job.creatorAddress?._id || job.creatorAddress;

  if (String(creatorId) !== String(userId)) {
    redirect("/dashboard");
  }

  if (![JOB_STATUS.DRAFT, JOB_STATUS.OPEN].includes(job.status)) {
    redirect("/dashboard");
  }

  return <EditJobPageClient initialJob={job} initialUser={user} />;
}
