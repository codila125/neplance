import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export function LoginPageForm({ error }) {
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

      {error && (
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
          {error}
        </div>
      )}

      <form action={loginAction}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Log In
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
