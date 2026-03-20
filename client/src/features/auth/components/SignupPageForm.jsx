"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { signupAction } from "@/lib/actions/auth";
import {
  FREELANCER_LANGUAGE_OPTIONS,
  FREELANCER_SKILL_GROUPS,
  FREELANCER_TAG_OPTIONS,
  NEPAL_LOCATION_OPTIONS,
} from "@/shared/constants/signupOptions";

const roles = [
  {
    value: "freelancer",
    label: "Work as a freelancer",
    description: "Create a strong profile and start applying to projects.",
  },
  {
    value: "client",
    label: "Hire talent",
    description: "Post projects, compare proposals, and manage contracts.",
  },
];

const INITIAL_SIGNUP_STATE = {
  message: "",
  errors: {},
  values: {},
};

const flattenSkillOptions = () =>
  FREELANCER_SKILL_GROUPS.flatMap((group) =>
    group.options.map((option) => ({
      value: option,
      label: option,
      group: group.label,
    })),
  );

function AddableSelectField({
  error,
  helperText,
  label,
  name,
  options,
  placeholder,
  selectedValues,
  setSelectedValues,
}) {
  const [pendingValue, setPendingValue] = useState("");
  const [customValue, setCustomValue] = useState("");

  const availableOptions = options.filter(
    (option) => !selectedValues.includes(option.value),
  );

  const appendValue = (value) => {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue || selectedValues.includes(normalizedValue)) {
      return;
    }

    setSelectedValues([...selectedValues, normalizedValue]);
  };

  const removeValue = (valueToRemove) => {
    setSelectedValues(
      selectedValues.filter((value) => value !== valueToRemove),
    );
  };

  const handleAddSelected = () => {
    appendValue(pendingValue);
    setPendingValue("");
  };

  const handleAddCustom = () => {
    appendValue(customValue);
    setCustomValue("");
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`${name}-select`}>
        {label}
      </label>

      <div
        style={{
          border: error
            ? "1px solid var(--color-error)"
            : "1px solid var(--color-border-light)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "white",
          padding: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            minHeight: "2.5rem",
            marginBottom: "var(--space-3)",
          }}
        >
          {selectedValues.length > 0 ? (
            selectedValues.map((value) => (
              <span
                key={value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 0.7rem",
                  borderRadius: "999px",
                  backgroundColor: "var(--color-primary-lightest)",
                  color: "var(--color-primary-dark)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 1,
                    fontSize: "1rem",
                  }}
                  aria-label={`Remove ${value}`}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span
              className="text-light"
              style={{ fontSize: "var(--text-sm)", alignSelf: "center" }}
            >
              Nothing selected yet.
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: "0.75rem",
            marginBottom: "var(--space-3)",
          }}
        >
          <select
            id={`${name}-select`}
            className="form-select"
            value={pendingValue}
            onChange={(event) => setPendingValue(event.target.value)}
          >
            <option value="">{placeholder}</option>
            {availableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.group
                  ? `${option.group} - ${option.label}`
                  : option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddSelected}
            disabled={!pendingValue}
          >
            Add
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: "0.75rem",
          }}
        >
          <input
            className="form-input"
            type="text"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            placeholder={`Add your own ${label.toLowerCase().slice(0, -1)}`}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddCustom}
            disabled={!customValue.trim()}
          >
            Add custom
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-light" style={{ fontSize: "var(--text-sm)" }}>
          {helperText}
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </div>
  );
}

export function SignupPageForm({ error }) {
  const [actionState, formAction, isPending] = useActionState(signupAction, {
    ...INITIAL_SIGNUP_STATE,
    message: error || "",
  });
  const fieldErrors = actionState?.errors || {};
  const values = actionState?.values || {};

  const [selectedRoles, setSelectedRoles] = useState(values.roles || []);
  const [selectedProvince, setSelectedProvince] = useState(
    values.province || "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    values.district || "",
  );
  const [selectedSkills, setSelectedSkills] = useState(values.skills || []);
  const [selectedTags, setSelectedTags] = useState(values.tags || []);
  const [selectedLanguages, setSelectedLanguages] = useState(
    values.languages || [],
  );

  useEffect(() => {
    setSelectedRoles(values.roles || []);
    setSelectedProvince(values.province || "");
    setSelectedDistrict(values.district || "");
    setSelectedSkills(Array.isArray(values.skills) ? values.skills : []);
    setSelectedTags(Array.isArray(values.tags) ? values.tags : []);
    setSelectedLanguages(
      Array.isArray(values.languages) ? values.languages : [],
    );
  }, [
    values.district,
    values.languages,
    values.province,
    values.roles,
    values.skills,
    values.tags,
  ]);

  const isFreelancerSelected = selectedRoles.includes("freelancer");
  const skillOptions = useMemo(() => flattenSkillOptions(), []);
  const tagOptions = useMemo(
    () =>
      FREELANCER_TAG_OPTIONS.map((tag) => ({
        value: tag,
        label: tag,
      })),
    [],
  );
  const languageOptions = useMemo(
    () =>
      FREELANCER_LANGUAGE_OPTIONS.map((language) => ({
        value: language,
        label: language,
      })),
    [],
  );

  const provinceOptions = useMemo(
    () => NEPAL_LOCATION_OPTIONS.map((item) => item.province),
    [],
  );

  const districtOptions = useMemo(() => {
    const provinceRecord = NEPAL_LOCATION_OPTIONS.find(
      (item) => item.province === selectedProvince,
    );
    return provinceRecord?.districts || [];
  }, [selectedProvince]);

  const handleRoleToggle = (role) => {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role],
    );
  };

  const handleProvinceChange = (event) => {
    const nextProvince = event.target.value;
    setSelectedProvince(nextProvince);
    setSelectedDistrict("");
  };

  const handleDistrictChange = (event) => {
    setSelectedDistrict(event.target.value);
  };

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
        <p className="text-light">
          Build a profile that clients can trust, or set up your hiring account
          in one go.
        </p>
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
          <legend className="form-label" style={{ marginBottom: "0.75rem" }}>
            I want to:
          </legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {roles.map((role) => {
              const isActive = selectedRoles.includes(role.value);

              return (
                <label
                  key={role.value}
                  style={{
                    border: isActive
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border-light)",
                    backgroundColor: isActive
                      ? "var(--color-primary-lightest)"
                      : "white",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                    display: "flex",
                    gap: "var(--space-3)",
                    cursor: "pointer",
                    alignItems: "flex-start",
                  }}
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.value}
                    checked={isActive}
                    onChange={() => handleRoleToggle(role.value)}
                    style={{ marginTop: "0.2rem" }}
                  />
                  <span>
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "0.2rem",
                        color: "var(--color-text)",
                      }}
                    >
                      {role.label}
                    </strong>
                    <span
                      className="text-light"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {role.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {fieldErrors.roles && (
            <p className="form-error" style={{ color: "var(--color-error)" }}>
              {fieldErrors.roles}
            </p>
          )}
        </fieldset>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
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
            <label className="form-label" htmlFor="province">
              Province
            </label>
            <select
              id="province"
              name="province"
              className="form-select"
              value={selectedProvince}
              onChange={handleProvinceChange}
            >
              <option value="">Select province</option>
              {provinceOptions.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {fieldErrors.province && (
              <p className="form-error">{fieldErrors.province}</p>
            )}
          </div>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District
            </label>
            <select
              id="district"
              name="district"
              className="form-select"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedProvince}
            >
              <option value="">
                {selectedProvince ? "Select district" : "Choose province first"}
              </option>
              {districtOptions.map((district) => (
                <option key={district.name} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
            {fieldErrors.district && (
              <p className="form-error">{fieldErrors.district}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="locality">
              Locality
            </label>
            <input
              id="locality"
              name="locality"
              type="text"
              className={`form-input ${fieldErrors.city ? "form-input-error" : ""}`}
              placeholder={
                selectedDistrict
                  ? "Enter your area or neighborhood"
                  : "Choose district first, then enter locality"
              }
              defaultValue={values.locality || values.city || ""}
              disabled={!selectedDistrict}
            />
            {fieldErrors.city && (
              <p className="form-error">{fieldErrors.city}</p>
            )}
          </div>
        </div>

        {isFreelancerSelected && (
          <>
            <div
              style={{
                marginTop: "var(--space-6)",
                padding: "var(--space-4)",
                backgroundColor: "var(--color-bg-light)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border-light)",
              }}
            >
              <h3
                style={{
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--text-lg)",
                }}
              >
                Freelancer profile setup
              </h3>
              <p className="text-light" style={{ marginBottom: 0 }}>
                Pick from suggested marketplace-friendly options, then add your
                own if you need something more specific.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <AddableSelectField
                error={fieldErrors.skills}
                helperText="Choose the services you want clients to find you for."
                label="Core Skills"
                name="skills"
                options={skillOptions}
                placeholder="Select a core skill"
                selectedValues={selectedSkills}
                setSelectedValues={setSelectedSkills}
              />

              <AddableSelectField
                error={fieldErrors.tags}
                helperText="Use tags to highlight style, speed, specialization, or work habits."
                label="Professional Tags"
                name="tags"
                options={tagOptions}
                placeholder="Select a professional tag"
                selectedValues={selectedTags}
                setSelectedValues={setSelectedTags}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <AddableSelectField
                error={fieldErrors.languages}
                helperText="Add the languages you can comfortably communicate and deliver work in."
                label="Languages"
                name="languages"
                options={languageOptions}
                placeholder="Select a language"
                selectedValues={selectedLanguages}
                setSelectedValues={setSelectedLanguages}
              />

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
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
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
          </>
        )}

        {!isFreelancerSelected && (
          <>
            <input type="hidden" name="hourlyRate" value="0" />
            <input type="hidden" name="experienceLevel" value="entry" />
            <input type="hidden" name="jobTypePreference" value="digital" />
            <input type="hidden" name="availabilityStatus" value="available" />
          </>
        )}

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
