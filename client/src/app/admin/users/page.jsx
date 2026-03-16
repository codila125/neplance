"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
// admin pages should not include the main site navbar

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = [];
      if (search) q.push(`search=${encodeURIComponent(search)}`);
      if (role) q.push(`role=${encodeURIComponent(role)}`);
      const query = q.length ? `?${q.join("&")}` : "";
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      // Use unauthenticated fetch so admin UI works without login
      const res = await fetch(`${API_BASE}/api/users${query}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        // Try relative path if API_BASE not set
        const r2 = await fetch(`/api/users${query}`);
        const json2 = await r2.json();
        setUsers(json2.data || []);
      } else {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchUsers();
  };

  return (
    <>
      <main
        className="section"
        style={{ backgroundColor: "var(--color-bg-page)" }}
      >
        <div className="container">
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
              onSubmit={handleSearch}
              style={{
                display: "flex",
                gap: "var(--space-3)",
                marginBottom: "var(--space-6)",
              }}
            >
              <input
                className="form-input"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            {loading ? (
              <div>Loading...</div>
            ) : (
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
                          style={{
                            padding: "var(--space-4)",
                            textAlign: "center",
                          }}
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: "var(--space-4)" }}>
              <Link href="/admin" className="btn btn-ghost">
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
