"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginPageForm({ error }) {
  const [actionState, formAction, isPending] = useActionState(loginAction, {
    message: error || "",
    errors: {},
    values: {},
  });
  const fieldErrors = actionState?.errors || {};
  const values = actionState?.values || {};

  return (
    <>
      <div className="mb-6">
        <h2
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--space-2)",
          }}
        >
          Log in to Neplance
        </h2>
        <p className="text-light">Welcome back! Please enter your details.</p>
      </div>

      {actionState?.message && (
        <div
          className="mb-6"
          style={{
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "#ffebee",
            color: "var(--color-error)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
          }}
        >
          {actionState.message}
        </div>
      )}

      <form action={formAction}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`form-input ${fieldErrors.email ? "form-input-error" : ""}`}
            placeholder="Enter your email"
            autoComplete="email"
            defaultValue={values.email || ""}
            required
          />
          {fieldErrors.email && (
            <p className="form-error">{fieldErrors.email}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={`form-input ${fieldErrors.password ? "form-input-error" : ""}`}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          {fieldErrors.password && (
            <p className="form-error">{fieldErrors.password}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Logging In..." : "Log In"}
        </button>
      </form>

      <div
        className="text-center text-light"
        style={{
          marginTop: "var(--space-6)",
          paddingTop: "var(--space-6)",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium">
          Sign up
        </Link>
      </div>
    </>
  );
}
