"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { JobCard } from "@/features/dashboard/components/JobCard";
import { deleteJobAction, publishJobAction } from "@/lib/actions/jobs";
import { JOB_STATUS } from "@/shared/constants/statuses";

export function ClientJobsSection({ initialContracts, initialUser }) {
  const router = useRouter();
  const [contracts, setContracts] = useState(initialContracts);
  const [, startMutationTransition] = useTransition();

  const handlePostDraftJob = async (job) => {
    if (!confirm("Are you sure you want to post this job?")) return;

    startMutationTransition(async () => {
      try {
        const result = await publishJobAction(job._id);
        setContracts((prev) =>
          prev.map((contract) =>
            contract._id === result.data._id ? result.data : contract,
          ),
        );
        router.refresh();
      } catch (err) {
        alert(err?.message || "Failed to post job");
      }
    });
  };

  const handleDeleteJob = async (job) => {
    const confirmMessage =
      job.status === JOB_STATUS.DRAFT
        ? "Are you sure you want to delete this draft?"
        : "Are you sure you want to delete this job? This action cannot be undone.";

    if (!confirm(confirmMessage)) return;

    startMutationTransition(async () => {
      try {
        await deleteJobAction(job._id);
        setContracts((prev) =>
          prev.filter((contract) => contract._id !== job._id),
        );
        router.refresh();
      } catch (err) {
        alert(err?.message || "Failed to delete job");
      }
    });
  };

  const handleEditJob = (job) => {
    router.push(`/jobs/${job._id}/edit`);
  };

  return (
    <div className="cards-list">
      {contracts.length > 0 ? (
        contracts.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            variant="default"
            onPostJob={handlePostDraftJob}
            onDeleteJob={handleDeleteJob}
            onEditJob={handleEditJob}
            currentUser={initialUser}
          />
        ))
      ) : (
        <EmptyState
          title="No Jobs Yet"
          description="Post a job to start receiving proposals."
        />
      )}
    </div>
  );
}
