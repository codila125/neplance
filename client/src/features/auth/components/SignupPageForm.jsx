"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/lib/actions/auth";

const roles = ["freelancer", "client"];
const INITIAL_SIGNUP_STATE = {
  message: "",
  errors: {},
  values: {},
};

export function SignupPageForm({ error }) {
  const [actionState, formAction, isPending] = useActionState(signupAction, {
    ...INITIAL_SIGNUP_STATE,
    message: error || "",
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
          Sign up for Neplance
        </h2>
        <p className="text-light">Join the world&apos;s work marketplace.</p>
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
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  defaultChecked={values.roles?.includes(role)}
                />
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </label>
            ))}
          </div>
          {fieldErrors.roles && (
            <p className="form-error" style={{ color: "var(--color-error)" }}>
              {fieldErrors.roles}
            </p>
          )}
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
              className={`form-input ${fieldErrors.name ? "form-input-error" : ""}`}
              placeholder="Enter your full name"
              autoComplete="name"
              defaultValue={values.name || ""}
              required
            />
            {fieldErrors.name && (
              <p className="form-error">{fieldErrors.name}</p>
            )}
          </div>
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
              className={`form-input ${fieldErrors.password ? "form-input-error" : ""}`}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && (
              <p className="form-error">{fieldErrors.password}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="passwordConfirm">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              className={`form-input ${fieldErrors.passwordConfirm ? "form-input-error" : ""}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            {fieldErrors.passwordConfirm && (
              <p className="form-error">{fieldErrors.passwordConfirm}</p>
            )}
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
            className={`form-input ${fieldErrors.phone ? "form-input-error" : ""}`}
            placeholder="Enter your phone number"
            autoComplete="tel"
            defaultValue={values.phone || ""}
          />
          {fieldErrors.phone && (
            <p className="form-error">{fieldErrors.phone}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            className={`form-input ${fieldErrors.bio ? "form-input-error" : ""}`}
            rows={3}
            placeholder="Tell people about your background"
            defaultValue={values.bio || ""}
          />
          {fieldErrors.bio && <p className="form-error">{fieldErrors.bio}</p>}
        </div>

        <div className="grid grid-cols-3" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              className={`form-input ${fieldErrors.city ? "form-input-error" : ""}`}
              defaultValue={values.city || ""}
            />
            {fieldErrors.city && (
              <p className="form-error">{fieldErrors.city}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District
            </label>
            <input
              id="district"
              name="district"
              type="text"
              className={`form-input ${fieldErrors.district ? "form-input-error" : ""}`}
              defaultValue={values.district || ""}
            />
            {fieldErrors.district && (
              <p className="form-error">{fieldErrors.district}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="province">
              Province
            </label>
            <input
              id="province"
              name="province"
              type="text"
              className={`form-input ${fieldErrors.province ? "form-input-error" : ""}`}
              defaultValue={values.province || ""}
            />
            {fieldErrors.province && (
              <p className="form-error">{fieldErrors.province}</p>
            )}
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
              className={`form-input ${fieldErrors.skills ? "form-input-error" : ""}`}
              placeholder="React, Node.js, UI Design"
              defaultValue={values.skills || ""}
            />
            {fieldErrors.skills && (
              <p className="form-error">{fieldErrors.skills}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="languages">
              Languages
            </label>
            <input
              id="languages"
              name="languages"
              type="text"
              className={`form-input ${fieldErrors.languages ? "form-input-error" : ""}`}
              placeholder="English, Nepali"
              defaultValue={values.languages || ""}
            />
            {fieldErrors.languages && (
              <p className="form-error">{fieldErrors.languages}</p>
            )}
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
              className={`form-input ${fieldErrors.hourlyRate ? "form-input-error" : ""}`}
              defaultValue={values.hourlyRate || "0"}
            />
            {fieldErrors.hourlyRate && (
              <p className="form-error">{fieldErrors.hourlyRate}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="experienceLevel">
              Experience Level
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              className="form-select"
              defaultValue={values.experienceLevel || "entry"}
            >
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            {fieldErrors.experienceLevel && (
              <p className="form-error">{fieldErrors.experienceLevel}</p>
            )}
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
              defaultValue={values.jobTypePreference || "digital"}
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
              <option value="both">Both</option>
            </select>
            {fieldErrors.jobTypePreference && (
              <p className="form-error">{fieldErrors.jobTypePreference}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="availabilityStatus">
              Availability
            </label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              className="form-select"
              defaultValue={values.availabilityStatus || "available"}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
            {fieldErrors.availabilityStatus && (
              <p className="form-error">{fieldErrors.availabilityStatus}</p>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Signing Up..." : "Sign Up"}
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
