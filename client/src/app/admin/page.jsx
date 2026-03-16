"use client"

import Link from "next/link"
import React from "react"
import { Navbar } from "@/shared/navigation/Navbar"

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="section" style={{ backgroundColor: "var(--color-bg-page)" }}>
        <div className="container">
          <div className="card" style={{ padding: "var(--space-8)" }}>
            <h1 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-2xl)" }}>Hello Admin!</h1>
            <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
              Select an area to manage.
            </p>

            <div className="grid grid-cols-3" style={{ gap: "var(--space-4)" }}>
              <Link href="/admin/users" className="btn btn-primary btn-lg">
                Users
              </Link>

              <Link href="/admin/jobs" className="btn btn-primary btn-lg">
                Jobs
              </Link>

              <Link href="/admin/pending-verification" className="btn btn-primary btn-lg">
                Users Pending Verification
              </Link>

              <Link href="/admin/disputes" className="btn btn-primary btn-lg">
                Disputes Raised
              </Link>

              <Link href="/admin/problems" className="btn btn-primary btn-lg">
                Problems Reported
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
