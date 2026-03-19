import Link from "next/link";
import { requireAdminSession } from "@/lib/server/auth";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pending-verification", label: "Verification" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/problems", label: "Problems" },
];

export default async function AdminLayout({ children }) {
  const { user } = await requireAdminSession();

  return (
    <main
      className="section"
      style={{ backgroundColor: "var(--color-bg-page)" }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "var(--space-6)",
            alignItems: "start",
          }}
        >
          <aside
            className="card"
            style={{
              padding: "var(--space-6)",
              position: "sticky",
              top: "var(--space-6)",
            }}
          >
            <div style={{ marginBottom: "var(--space-6)" }}>
              <div
                className="text-light"
                style={{ fontSize: "var(--text-sm)" }}
              >
                Admin Console
              </div>
              <h2 style={{ margin: "var(--space-2) 0 0" }}>
                {user?.name || "Admin"}
              </h2>
            </div>
            <nav style={{ display: "grid", gap: "var(--space-2)" }}>
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section style={{ minWidth: 0 }}>{children}</section>
        </div>
      </div>
    </main>
  );
}
