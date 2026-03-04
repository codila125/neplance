"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/services/api";
import { useAuthGate } from "@/shared/hooks/useAuthGate";
import { Navbar } from "@/shared/navigation/Navbar";

export default function TalentPage() {
  const { user, isHydrated, logout, switchRole } = useAuthGate({
    mode: "require-auth",
    redirectTo: "/",
  });
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const data = await apiCall("/api/users/freelancers");
        if (data.status === "success") {
          setFreelancers(data.data || []);
        }
      } catch (_) {
        setFreelancers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleRoleSwitch = (updatedUser) => {
    switchRole(updatedUser);
    if (updatedUser?.role?.[0] === "freelancer") {
      router.push("/jobs");
    }
  };

  const normalizedQuery = searchQuery.toLowerCase();
  const filtered = freelancers.filter((f) => {
    const name = f.name?.toLowerCase() || "";
    const email = f.email?.toLowerCase() || "";
    return name.includes(normalizedQuery) || email.includes(normalizedQuery);
  });

  if (!isHydrated) return null;

  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />

      <div className="dashboard">
        {/* Hero */}
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
              Find <span style={{ color: "var(--color-primary)" }}>Talent</span>
            </h1>
            <p
              className="text-light"
              style={{
                fontSize: "var(--text-xl)",
                maxWidth: "700px",
                margin: "0 auto var(--space-8)",
              }}
            >
              Browse skilled freelancers and invite them to your projects
            </p>

            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <input
                  type="text"
                  placeholder="Search freelancers by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Freelancer List */}
        <div className="container section-sm">
          {loading ? (
            <div style={{ textAlign: "center", padding: "var(--space-16)" }}>
              <div
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-primary)",
                }}
              >
                Loading freelancers...
              </div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-3" style={{ gap: "var(--space-4)" }}>
              {filtered.map((freelancer) => (
                <article key={freelancer._id} className="card">
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-4)",
                      alignItems: "center",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary-lightest)",
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--text-2xl)",
                        fontWeight: "var(--font-weight-bold)",
                        flexShrink: 0,
                      }}
                    >
                      {freelancer.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: "var(--text-lg)",
                          fontWeight: "var(--font-weight-semibold)",
                          marginBottom: "var(--space-1)",
                        }}
                      >
                        {freelancer.name || "Unnamed"}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--color-text-light)",
                          fontSize: "var(--text-sm)",
                        }}
                      >
                        {freelancer.email}
                      </p>
                    </div>
                  </div>

                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-4)",
                      }}
                    >
                      {freelancer.skills.slice(0, 5).map((skill) => (
                        <span key={skill} className="badge badge-success">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() =>
                      router.push(`/freelancers/${freelancer._id}`)
                    }
                  >
                    View Profile
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{ textAlign: "center", padding: "var(--space-8)" }}
            >
              <h3 style={{ marginBottom: "var(--space-3)" }}>
                No freelancers found
              </h3>
              <p className="text-light">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Freelancers will appear here once they join the platform"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
