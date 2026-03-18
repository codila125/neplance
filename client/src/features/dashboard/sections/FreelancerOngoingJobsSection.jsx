"use client";

import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { JobCard } from "@/features/dashboard/components/JobCard";

export function FreelancerOngoingJobsSection({ initialJobs, initialUser }) {
  return initialJobs.length > 0 ? (
    <div className="cards-list">
      {initialJobs.map((job) => (
        <JobCard
          key={job._id}
          job={job}
          variant="current"
          currentUser={initialUser}
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
