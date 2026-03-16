"use client";

import Link from "next/link";
import React from "react";

export default function AdminPendingVerificationPage() {
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
              Users Pending Verification
            </h1>
            <p
              className="text-muted"
              style={{ marginBottom: "var(--space-6)" }}
            >
              Placeholder — list of users awaiting admin verification.
            </p>
            <Link href="/admin" className="btn btn-ghost">
              Back to Admin
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
