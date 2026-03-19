import { listUsersServer } from "@/lib/server/users";

export default async function AdminUsersPage({ searchParams }) {
  const search = (searchParams?.search || "").toString();
  const role = (searchParams?.role || "").toString();
  const q = [];
  if (search) q.push(`search=${encodeURIComponent(search)}`);
  if (role) q.push(`role=${encodeURIComponent(role)}`);
  const query = q.length ? `?${q.join("&")}` : "";

  const users = await listUsersServer(query);

  return (
    <div className="card" style={{ padding: "var(--space-8)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Users</h1>
      </div>

      <form
        method="get"
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        <input
          name="search"
          className="form-input"
          placeholder="Search by name or email"
          defaultValue={search}
        />
        <select name="role" className="form-select" defaultValue={role}>
          <option value="">All roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <th style={{ padding: "var(--space-3)" }}>Name</th>
              <th style={{ padding: "var(--space-3)" }}>Email</th>
              <th style={{ padding: "var(--space-3)" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id}
                style={{
                  borderBottom: "1px solid var(--color-border-light)",
                  verticalAlign: "middle",
                }}
              >
                <td style={{ padding: "var(--space-3)" }}>{u.name}</td>
                <td style={{ padding: "var(--space-3)" }}>{u.email}</td>
                <td style={{ padding: "var(--space-3)" }}>
                  {Array.isArray(u.role) ? u.role.join(", ") : u.role}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{ padding: "var(--space-4)", textAlign: "center" }}
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
