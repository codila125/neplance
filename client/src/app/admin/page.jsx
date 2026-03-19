import Link from "next/link";
import { listVerificationQueueServer } from "@/lib/server/admin";
import { listAllJobsServer } from "@/lib/server/jobs";
import { listUsersServer } from "@/lib/server/users";

export default async function AdminPage() {
  const [pendingVerification, users, jobs] = await Promise.all([
    listVerificationQueueServer("pending"),
    listUsersServer(),
    listAllJobsServer(),
  ]);

  const cards = [
    {
      href: "/admin/pending-verification",
      label: "Verification Queue",
      value: pendingVerification.length,
    },
    {
      href: "/admin/users",
      label: "Users",
      value: users.length,
    },
    {
      href: "/admin/jobs",
      label: "Jobs",
      value: jobs.length,
    },
    {
      href: "/admin/disputes",
      label: "Disputes",
      value: "Soon",
    },
    {
      href: "/admin/problems",
      label: "Problems",
      value: "Soon",
    },
  ];

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <h1
        style={{
          marginBottom: "var(--space-4)",
          fontSize: "var(--text-2xl)",
        }}
      >
        Admin Overview
      </h1>
      <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
        Manage verification, marketplace activity, and operational issues.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card-sm"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div
              className="text-light"
              style={{ marginBottom: "var(--space-2)" }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: "var(--text-3xl)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {card.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
