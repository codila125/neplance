"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { JobCard } from "@/features/dashboard/components/JobCard";
import { JobModal } from "@/features/dashboard/components/JobModal";
import { toggleSavedJobAction } from "@/lib/actions/jobs";
import { createProposalMutationAction } from "@/lib/actions/proposals";
import {
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
} from "@/shared/constants/jobCategories";

export function JobsPageClient({
  existingProposalByJobId = {},
  initialJobs = [],
  initialSearchParams = {},
  initialUser,
}) {
  const user = initialUser;
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [searchFilters, setSearchFilters] = useState({
    category: initialSearchParams.category || "",
    jobType: initialSearchParams.jobType || "",
    experienceLevel: initialSearchParams.experienceLevel || "",
    search: initialSearchParams.search || "",
    skills: initialSearchParams.skills || "",
    tags: initialSearchParams.tags || "",
    sort: initialSearchParams.sort || "-createdAt",
    savedOnly: initialSearchParams.savedOnly === "true",
  });
  const [isSubmittingProposal, startProposalTransition] = useTransition();
  const [isSavingJob, startSaveTransition] = useTransition();
  const router = useRouter();

  const handleOpenProposalModal = (job) => {
    if (!user) {
      router.push("/");
      return;
    }
    setModalMode("proposal");
    setSelectedJob(job);
  };

  const handleViewJobDetails = (job) => {
    setModalMode("view");
    setSelectedJob(job);
  };

  const handleCloseModal = () => setSelectedJob(null);

  const handleSubmitProposal = async (proposalData) => {
    startProposalTransition(async () => {
      await createProposalMutationAction(proposalData);
      setSelectedJob(null);
    });
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSave = (job) => {
    startSaveTransition(async () => {
      try {
        const result = await toggleSavedJobAction(job._id);
        setJobs((previous) =>
          previous.map((item) =>
            item._id === job._id
              ? { ...item, isSaved: result.data.saved }
              : item,
          ),
        );
      } catch {}
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchFilters.category) {
      params.append("category", searchFilters.category);
    }
    if (searchFilters.jobType) {
      params.append("jobType", searchFilters.jobType);
    }
    if (searchFilters.experienceLevel) {
      params.append("experienceLevel", searchFilters.experienceLevel);
    }
    if (searchFilters.search) {
      params.append("search", searchFilters.search);
    }
    if (searchFilters.skills) {
      params.append("skills", searchFilters.skills);
    }
    if (searchFilters.tags) {
      params.append("tags", searchFilters.tags);
    }
    if (searchFilters.sort) {
      params.append("sort", searchFilters.sort);
    }
    if (searchFilters.savedOnly) {
      params.append("savedOnly", "true");
    }

    const query = params.toString();
    router.push(query ? `/jobs?${query}` : "/jobs");
  };

  const clearFilters = () => {
    setSearchFilters({
      category: "",
      jobType: "",
      experienceLevel: "",
      search: "",
      skills: "",
      tags: "",
      sort: "-createdAt",
      savedOnly: false,
    });
    router.push("/jobs");
  };

  const userSkills = Array.isArray(user?.skills)
    ? user.skills.map((skill) => String(skill).toLowerCase())
    : [];
  const matchedJobs = jobs
    .map((job) => {
      const jobSkills = Array.isArray(job.requiredSkills)
        ? job.requiredSkills.map((skill) => String(skill).toLowerCase())
        : [];
      const jobTags = Array.isArray(job.tags)
        ? job.tags.map((tag) => String(tag).toLowerCase())
        : [];
      const matchCount = userSkills.filter(
        (skill) => jobSkills.includes(skill) || jobTags.includes(skill),
      ).length;

      return { job, matchCount };
    })
    .filter((item) => item.matchCount > 0)
    .sort((left, right) => right.matchCount - left.matchCount)
    .slice(0, 4)
    .map((item) => item.job);
  const visibleJobs = searchFilters.savedOnly
    ? jobs.filter((job) => job.isSaved)
    : jobs;

  return (
    <>
      <div className="dashboard">
        <section
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid var(--color-border-light)",
            padding: "var(--space-12) 0",
          }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "var(--text-5xl)",
                fontWeight: "var(--font-weight-bold)",
                marginBottom: "var(--space-4)",
              }}
            >
              Find Your Next{" "}
              <span style={{ color: "var(--color-primary)" }}>Opportunity</span>
            </h1>
            <p
              className="text-light"
              style={{
                fontSize: "var(--text-xl)",
                maxWidth: "700px",
                margin: "0 auto var(--space-8)",
              }}
            >
              Browse thousands of projects and connect with clients looking for
              your skills
            </p>

            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchFilters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 180px", minWidth: "180px" }}>
                  <select
                    value={searchFilters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <option value="">All Categories</option>
                    {JOB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 140px", minWidth: "140px" }}>
                  <select
                    value={searchFilters.jobType}
                    onChange={(e) =>
                      handleFilterChange("jobType", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="digital">Digital</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 160px", minWidth: "160px" }}>
                  <select
                    value={searchFilters.experienceLevel}
                    onChange={(e) =>
                      handleFilterChange("experienceLevel", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <option value="">All Levels</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 180px", minWidth: "180px" }}>
                  <input
                    type="text"
                    placeholder="Filter by skills"
                    value={searchFilters.skills}
                    onChange={(e) =>
                      handleFilterChange("skills", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 180px", minWidth: "180px" }}>
                  <input
                    type="text"
                    placeholder="Filter by tags"
                    value={searchFilters.tags}
                    onChange={(e) => handleFilterChange("tags", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 180px", minWidth: "180px" }}>
                  <select
                    value={searchFilters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <option value="-createdAt">Newest</option>
                    <option value="createdAt">Oldest</option>
                    <option value="-budget.max">Highest budget</option>
                    <option value="budget.min">Lowest budget</option>
                    <option value="deadline">Nearest deadline</option>
                  </select>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "0 var(--space-2)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={searchFilters.savedOnly}
                    onChange={(event) =>
                      handleFilterChange("savedOnly", event.target.checked)
                    }
                  />
                  Saved only
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSearch}
                >
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="container section-sm">
          {matchedJobs.length > 0 && !searchFilters.savedOnly ? (
            <section style={{ marginBottom: "var(--space-8)" }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 style={{ marginBottom: "var(--space-1)" }}>For You</h2>
                  <p className="text-light mb-0">
                    Matches based on your saved skills and job tags.
                  </p>
                </div>
              </div>
              <div className="cards-list">
                {matchedJobs.map((job) => (
                  <JobCard
                    key={`for-you-${job._id}`}
                    existingProposalId={
                      existingProposalByJobId[job._id] || null
                    }
                    job={job}
                    variant="find"
                    onSubmitProposal={handleOpenProposalModal}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {visibleJobs.length > 0 ? (
            <div className="cards-list">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job._id}
                  existingProposalId={existingProposalByJobId[job._id] || null}
                  job={job}
                  variant="find"
                  onSubmitProposal={handleOpenProposalModal}
                  onViewDetails={handleViewJobDetails}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "var(--space-8)",
              }}
            >
              <h3 style={{ marginBottom: "var(--space-3)" }}>No jobs found</h3>
              <p className="text-light">
                {searchFilters.savedOnly
                  ? "You have not saved any jobs that match the current filters."
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          mode={modalMode}
          onSubmit={handleSubmitProposal}
          onClose={handleCloseModal}
          loading={isSubmittingProposal}
          saving={isSavingJob}
          userRole={user?.role?.[0]}
          currentUser={user}
        />
      )}
    </>
  );
}
