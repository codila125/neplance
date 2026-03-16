"use client";

import { useState } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { JobCard } from "@/features/dashboard/components/JobCard";
import {
  requestJobCancellationAction,
  respondJobCancellationAction,
} from "@/lib/actions/jobs";

export function FreelancerOngoingJobsSection({ initialJobs, initialUser }) {
  const [ongoingJobs, setOngoingJobs] = useState(initialJobs);

  const handleRequestCancellation = async (job, reason) => {
    const result = await requestJobCancellationAction(job._id, reason);
    setOngoingJobs((prev) =>
      prev.map((item) => (item._id === result.data._id ? result.data : item)),
    );
  };

  const handleRespondCancellation = async (job, action) => {
    const result = await respondJobCancellationAction(job._id, action);
    setOngoingJobs((prev) =>
      prev.map((item) => (item._id === result.data._id ? result.data : item)),
    );
  };

  return ongoingJobs.length > 0 ? (
    <div className="cards-list">
      {ongoingJobs.map((job) => (
        <JobCard
          key={job._id}
          job={job}
          variant="current"
          currentUser={initialUser}
          onRequestCancellation={handleRequestCancellation}
          onRespondCancellation={handleRespondCancellation}
        />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No Ongoing Contracts"
      description="Contracts you're currently working on will appear here."
    />
  );
}
