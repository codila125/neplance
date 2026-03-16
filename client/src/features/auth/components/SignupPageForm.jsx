import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";

const roles = ["freelancer", "client"];

export function SignupPageForm({ error }) {
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
          Sign up for Neplance
        </h2>
        <p className="text-light">Join the world&apos;s work marketplace.</p>
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

      <form action={signupAction}>
        <fieldset className="form-group">
          <legend className="form-label" style={{ marginBottom: "0.5rem" }}>
            I want to:
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {roles.map((role) => (
              <label
                key={role}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" name="roles" value={role} />
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>
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
        </div>

        <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="passwordConfirm">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              className="form-input"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="form-input"
            placeholder="Enter your phone number"
            autoComplete="tel"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            className="form-input"
            rows={3}
            placeholder="Tell people about your background"
          />
        </div>

        <div className="grid grid-cols-3" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="city">
              City
            </label>
            <input id="city" name="city" type="text" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District
            </label>
            <input
              id="district"
              name="district"
              type="text"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="province">
              Province
            </label>
            <input
              id="province"
              name="province"
              type="text"
              className="form-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="skills">
              Skills
            </label>
            <input
              id="skills"
              name="skills"
              type="text"
              className="form-input"
              placeholder="React, Node.js, UI Design"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="languages">
              Languages
            </label>
            <input
              id="languages"
              name="languages"
              type="text"
              className="form-input"
              placeholder="English, Nepali"
            />
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="hourlyRate">
              Hourly Rate (NPR)
            </label>
            <input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="0"
              className="form-input"
              defaultValue="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="experienceLevel">
              Experience Level
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              className="form-select"
              defaultValue="entry"
            >
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="jobTypePreference">
              Job Type Preference
            </label>
            <select
              id="jobTypePreference"
              name="jobTypePreference"
              className="form-select"
              defaultValue="digital"
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="availabilityStatus">
              Availability
            </label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              className="form-select"
              defaultValue="available"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Sign Up
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
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Log in
        </Link>
      </div>
    </>
  );
}
