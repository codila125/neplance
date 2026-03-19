import Link from "next/link";
import { listAllJobsServer } from "@/lib/server/jobs";

export default async function AdminJobsPage({ searchParams }) {
  const search = (searchParams?.search || "").toString();
  const category = (searchParams?.category || "").toString();
  const jobType = (searchParams?.jobType || "").toString();

  const q = [];
  if (search) q.push(`search=${encodeURIComponent(search)}`);
  if (category) q.push(`category=${encodeURIComponent(category)}`);
  if (jobType) q.push(`jobType=${encodeURIComponent(jobType)}`);
  const query = q.length ? `?${q.join("&")}` : "";

  const jobs = await listAllJobsServer(query);

  const categories = Array.from(
    new Set(jobs.map((j) => j.category).filter(Boolean)),
  );
  const jobTypes = Array.from(
    new Set(jobs.map((j) => j.jobType).filter(Boolean)),
  );

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <h1
        style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-2xl)" }}
      >
        Jobs
      </h1>

      <form
        method="get"
        style={{
          display: "flex",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <input
          name="search"
          aria-label="Search jobs"
          defaultValue={search}
          placeholder="Search by title or description"
          className="input"
          style={{ flex: 1 }}
        />

        <select name="category" defaultValue={category} className="select">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select name="jobType" defaultValue={jobType} className="select">
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

      <div style={{ marginTop: "var(--space-4)" }}>
        {jobs.length === 0 ? (
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
                      {job.creatorAddress?.name || job.creatorAddress || "—"} •{" "}
                      {job.category || "—"} • {job.jobType || "—"}
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
    </div>
  );
}
