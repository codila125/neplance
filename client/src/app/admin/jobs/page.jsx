"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");

  const [categories, setCategories] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const fetchJobs = async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (opts.search !== undefined ? opts.search : search)
        params.set("search", opts.search ?? search);
      if (opts.category !== undefined ? opts.category : category)
        params.set("category", opts.category ?? category);
      if (opts.jobType !== undefined ? opts.jobType : jobType)
        params.set("jobType", opts.jobType ?? jobType);
      params.set("limit", "100");

      const res = await fetch(
        `${API_BASE}/api/admin/jobs?${params.toString()}`
      );
      if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
      const data = await res.json();
      setJobs(data.data || []);

      // derive categories and jobTypes from returned jobs
      const cats = Array.from(
        new Set((data.data || []).map((j) => j.category).filter(Boolean))
      );
      const types = Array.from(
        new Set((data.data || []).map((j) => j.jobType).filter(Boolean))
      );
      setCategories(cats);
      setJobTypes(types);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs({ search: "", category: "", jobType: "" });
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchJobs({ search, category, jobType });
  };

  return (
    <>
      <main
        className="section"
        style={{ backgroundColor: "var(--color-bg-page)" }}
      >
        <div className="container">
          <div className="card" style={{ padding: "var(--space-8)" }}>
            <h1
              style={{
                marginBottom: "var(--space-4)",
                fontSize: "var(--text-2xl)",
              }}
            >
              Jobs
            </h1>

            <form
              onSubmit={onSearch}
              style={{
                display: "flex",
                gap: "var(--space-4)",
                marginBottom: "var(--space-4)",
              }}
            >
              <input
                aria-label="Search jobs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                className="input"
                style={{ flex: 1 }}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="select"
              >
                <option value="">All types</option>
                {jobTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button className="btn" type="submit">
                Search
              </button>
            </form>

            {loading && <p>Loading jobs…</p>}
            {error && <p className="text-error">{error}</p>}

            <div style={{ marginTop: "var(--space-4)" }}>
              {jobs.length === 0 && !loading ? (
                <p className="text-muted">No jobs found.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {jobs.map((job) => (
                    <li
                      key={job._id}
                      className="card"
                      style={{
                        marginBottom: "var(--space-3)",
                        padding: "var(--space-3)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>
                            {job.title}
                          </h3>
                          <div className="text-muted">
                            {job.creatorAddress?.name ||
                              job.creatorAddress ||
                              "—"}{" "}
                            • {job.category || "—"} • {job.jobType || "—"}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "var(--space-3)",
                            alignItems: "center",
                          }}
                        >
                          <div className="text-muted">
                            Proposals: {job.proposalCount ?? 0}
                          </div>
                          <Link
                            href={`/jobs/${job._id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link href="/admin" className="btn btn-ghost">
              Back to Admin
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
