"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="neplance-error-shell" role="alert">
      <div className="neplance-error-panel">
        <p className="neplance-error-eyebrow">Something went wrong</p>
        <h2 className="neplance-error-title">We couldn't load this page.</h2>
        <p className="neplance-error-copy">
          Please try again. If the problem continues, head back to a stable
          section of Neplance and retry the action.
        </p>
        <div className="neplance-error-actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
