"use client";

import { useActionState, useMemo, useState } from "react";
import { createJobAction } from "@/lib/actions/jobs";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Input } from "@/shared/components/UI";
import {
  DISTRICT_TO_PROVINCE,
  JOB_CATEGORIES,
  NEPAL_CITIES,
  NEPAL_DISTRICTS,
  NEPAL_PROVINCES,
  PROPERTY_TYPES,
} from "@/shared/constants/jobCategories";

const renderSelect = ({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
  disabled,
  required = false,
  helperText,
}) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">
      {label}
      {required ? (
        <span style={{ color: "var(--color-error)" }}> *</span>
      ) : null}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`form-select ${error ? "form-select-error" : ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const normalizedOption =
          typeof option === "string"
            ? { value: option, label: option }
            : option;
        return (
          <option key={normalizedOption.value} value={normalizedOption.value}>
            {normalizedOption.label}
          </option>
        );
      })}
    </select>
    {helperText ? <p className="job-form-helper">{helperText}</p> : null}
    {error ? <p className="form-error">{error}</p> : null}
  </div>
);

export function ClientPostJobSection() {
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    jobType: "digital",
    budgetType: "fixed_budget",
    category: "",
    subcategory: "",
    tags: "",
    requiredSkills: "",
    experienceLevel: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    isUrgent: false,
    locationCity: "",
    locationDistrict: "",
    locationProvince: "",
    locationAddress: "",
    propertyType: "",
    siteVisitRequired: false,
    preferredVisitDate: "",
    preferredWorkDate: "",
    materialsPreference: "",
    safetyNotes: "",
    estimatedDuration: "",
    attachments: [],
  });
  const [actionState, formAction, isPending] = useActionState(createJobAction, {
    message: "",
    errors: {},
  });
  const fieldErrors = actionState?.errors || {};

  const handleFormChange = (field, value) => {
    setFormState((prev) => {
      if (field === "jobType" && value === "digital") {
        return {
          ...prev,
          jobType: value,
          budgetType: "fixed_budget",
          siteVisitRequired: false,
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleDistrictChange = (district) => {
    const province = DISTRICT_TO_PROVINCE[district] || "";
    setFormState((prev) => ({
      ...prev,
      locationDistrict: district,
      locationProvince: province || prev.locationProvince,
    }));
  };

  const handleUploadedAttachment = (attachment) => {
    setFormState((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          id: Date.now() + Math.random(),
          name: attachment.name || "",
          publicId: attachment.publicId || "",
          resourceType: attachment.resourceType || "raw",
          url: attachment.url,
        },
      ],
    }));
  };

  const removeAttachment = (index) => {
    setFormState((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const jobPayload = useMemo(() => {
    const tags = formState.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const requiredSkills = formState.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const location =
      formState.jobType === "physical"
        ? {
            address: formState.locationAddress.trim() || undefined,
            city: formState.locationCity.trim() || undefined,
            district: formState.locationDistrict.trim() || undefined,
            province: formState.locationProvince.trim() || undefined,
          }
        : undefined;
    const physicalDetails =
      formState.jobType === "physical"
        ? {
            propertyType: formState.propertyType.trim() || undefined,
            siteVisitRequired: formState.siteVisitRequired,
            preferredVisitDate: formState.preferredVisitDate || undefined,
            preferredWorkDate: formState.preferredWorkDate || undefined,
            materialsPreference: formState.materialsPreference || undefined,
            safetyNotes: formState.safetyNotes.trim() || undefined,
            estimatedDuration: formState.estimatedDuration.trim() || undefined,
          }
        : undefined;

    return {
      title: formState.title.trim(),
      description: formState.description.trim(),
      jobType: formState.jobType,
      category: formState.category.trim(),
      subcategory: formState.subcategory.trim() || undefined,
      tags,
      requiredSkills,
      experienceLevel: formState.experienceLevel || undefined,
      budget: {
        min: Number(formState.budgetMin) || 0,
        max: formState.budgetMax ? Number(formState.budgetMax) : undefined,
        currency: "NPR",
      },
      budgetType:
        formState.jobType === "physical"
          ? formState.budgetType
          : "fixed_budget",
      deadline: formState.deadline || undefined,
      isUrgent: formState.isUrgent,
      location,
      physicalDetails,
      attachments: formState.attachments.map((attachment) => attachment.url),
      isPublic: true,
    };
  }, [formState]);

  return (
    <form className="card" action={formAction}>
      <input type="hidden" name="payload" value={JSON.stringify(jobPayload)} />
      {actionState?.message && (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          <p style={{ margin: 0 }}>{actionState.message}</p>
        </div>
      )}

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 1</p>
            <h3 className="job-form-section-title">Job basics</h3>
            <p className="job-form-section-copy">
              Start with a clear title and describe what you want done.
            </p>
          </div>
        </div>
        <div className="job-form-grid job-form-grid-single">
          <Input
            label="Job Title"
            value={formState.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
            placeholder="e.g. Interior painting for a 2-bedroom apartment"
            required
            disabled={isPending}
            error={fieldErrors.title}
          />
        </div>
        <Input
          label="Description"
          value={formState.description}
          onChange={(e) => handleFormChange("description", e.target.value)}
          placeholder="Describe the work scope, expected output, and any important conditions"
          disabled={isPending}
          error={fieldErrors.description}
        />
        <div className="job-form-grid job-form-grid-3">
          {renderSelect({
            id: "jobType",
            label: "Job Type",
            value: formState.jobType,
            options: [
              { value: "digital", label: "Digital" },
              { value: "physical", label: "Physical / On-site" },
            ],
            placeholder: "Select job type",
            onChange: (e) => handleFormChange("jobType", e.target.value),
            error: fieldErrors.jobType,
            disabled: isPending,
          })}
          {renderSelect({
            id: "category",
            label: "Category",
            value: formState.category,
            options: JOB_CATEGORIES,
            placeholder: "Select category",
            onChange: (e) => handleFormChange("category", e.target.value),
            error: fieldErrors.category,
            disabled: isPending,
            required: true,
          })}
          <Input
            label="Subcategory"
            value={formState.subcategory}
            onChange={(e) => handleFormChange("subcategory", e.target.value)}
            placeholder="e.g. Frontend, Plumbing repair"
            disabled={isPending}
            error={fieldErrors.subcategory}
          />
        </div>
      </div>

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 2</p>
            <h3 className="job-form-section-title">Skills and scope</h3>
            <p className="job-form-section-copy">
              Add keywords that help the right freelancer understand the job
              quickly.
            </p>
          </div>
        </div>
        <div className="job-form-grid job-form-grid-3">
          <Input
            label="Tags (comma separated)"
            value={formState.tags}
            onChange={(e) => handleFormChange("tags", e.target.value)}
            placeholder="e.g. urgent, repair, remote"
            disabled={isPending}
            error={fieldErrors.tags}
          />
          <Input
            label="Required Skills (comma separated)"
            value={formState.requiredSkills}
            onChange={(e) => handleFormChange("requiredSkills", e.target.value)}
            placeholder="e.g. JavaScript, CSS or painting, plumbing"
            disabled={isPending}
            error={fieldErrors.requiredSkills}
          />
          {renderSelect({
            id: "experienceLevel",
            label: "Experience Level",
            value: formState.experienceLevel,
            options: [
              { value: "entry", label: "Entry Level" },
              { value: "intermediate", label: "Intermediate" },
              { value: "expert", label: "Expert" },
            ],
            placeholder: "Any level",
            onChange: (e) =>
              handleFormChange("experienceLevel", e.target.value),
            error: fieldErrors.experienceLevel,
            disabled: isPending,
          })}
        </div>
      </div>

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 3</p>
            <h3 className="job-form-section-title">Budget and timeline</h3>
            <p className="job-form-section-copy">
              Set budget expectations, due date, and urgency clearly.
            </p>
          </div>
        </div>
        <div
          className={`job-form-grid ${
            formState.jobType === "physical"
              ? "job-form-grid-4"
              : "job-form-grid-3"
          }`}
        >
          <Input
            label="Budget Min (NPR)"
            type="number"
            value={formState.budgetMin}
            onChange={(e) => handleFormChange("budgetMin", e.target.value)}
            placeholder={
              formState.budgetType === "inspection_required" ? "0" : "5000"
            }
            required={formState.budgetType === "fixed_budget"}
            disabled={isPending}
            error={fieldErrors["budget.min"]}
          />
          <Input
            label="Budget Max (NPR)"
            type="number"
            value={formState.budgetMax}
            onChange={(e) => handleFormChange("budgetMax", e.target.value)}
            placeholder="10000"
            disabled={isPending}
            error={fieldErrors["budget.max"]}
          />
          {formState.jobType === "physical"
            ? renderSelect({
                id: "budgetType",
                label: "Pricing Intent",
                value: formState.budgetType,
                options: [
                  { value: "fixed_budget", label: "Client knows the budget" },
                  {
                    value: "inspection_required",
                    label: "Inspection required first",
                  },
                ],
                placeholder: "Select pricing intent",
                onChange: (e) => handleFormChange("budgetType", e.target.value),
                error: fieldErrors.budgetType,
                disabled: isPending,
              })
            : null}
          <Input
            label="Deadline"
            type="date"
            value={formState.deadline}
            onChange={(e) => handleFormChange("deadline", e.target.value)}
            disabled={isPending}
            error={fieldErrors.deadline}
          />
        </div>
        <div className="job-form-toggle-row">
          <label htmlFor="isUrgent" className="job-form-checkbox">
            <input
              type="checkbox"
              id="isUrgent"
              checked={formState.isUrgent}
              onChange={(e) => handleFormChange("isUrgent", e.target.checked)}
              disabled={isPending}
            />
            <span>
              <strong>Mark this job as urgent</strong>
              <small>Use this if you need faster freelancer responses.</small>
            </span>
          </label>
        </div>
      </div>

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 4</p>
            <h3 className="job-form-section-title">
              {formState.jobType === "physical"
                ? "On-site job details"
                : "Digital job details"}
            </h3>
            <p className="job-form-section-copy">
              {formState.jobType === "physical"
                ? "Add the exact location, property type, visit preferences, and access notes in a cleaner layout."
                : "Keep the brief remote-friendly and use attachments to share examples, brand guides, or reference files."}
            </p>
          </div>
          <span className="badge badge-primary">
            {formState.jobType === "physical"
              ? "Physical service"
              : "Digital delivery"}
          </span>
        </div>

        {formState.jobType === "physical" ? (
          <div className="job-form-physical-layout">
            <div className="job-form-subsection">
              <h4 className="job-form-subsection-title">Location</h4>
              <div className="job-form-grid job-form-grid-2">
                {renderSelect({
                  id: "locationCity",
                  label: "City",
                  value: formState.locationCity,
                  options: NEPAL_CITIES,
                  placeholder: "Select city",
                  onChange: (e) =>
                    handleFormChange("locationCity", e.target.value),
                  error: fieldErrors["location.city"],
                  disabled: isPending,
                })}
                {renderSelect({
                  id: "locationDistrict",
                  label: "District",
                  value: formState.locationDistrict,
                  options: NEPAL_DISTRICTS,
                  placeholder: "Select district",
                  onChange: (e) => handleDistrictChange(e.target.value),
                  error: fieldErrors["location.district"],
                  disabled: isPending,
                  helperText:
                    "Province is auto-filled after choosing a district.",
                })}
              </div>
              <div className="job-form-grid job-form-grid-2">
                {renderSelect({
                  id: "locationProvince",
                  label: "Province",
                  value: formState.locationProvince,
                  options: NEPAL_PROVINCES,
                  placeholder: "Select province",
                  onChange: (e) =>
                    handleFormChange("locationProvince", e.target.value),
                  error: fieldErrors["location.province"],
                  disabled: isPending,
                })}
                <Input
                  label="Address / Landmark"
                  value={formState.locationAddress}
                  onChange={(e) =>
                    handleFormChange("locationAddress", e.target.value)
                  }
                  placeholder="House no., street, chowk, nearby landmark"
                  disabled={isPending}
                  error={fieldErrors["location.address"]}
                />
              </div>
            </div>

            <div className="job-form-subsection">
              <h4 className="job-form-subsection-title">Property and visit</h4>
              <div className="job-form-grid job-form-grid-2">
                {renderSelect({
                  id: "propertyType",
                  label: "Property Type",
                  value: formState.propertyType,
                  options: PROPERTY_TYPES,
                  placeholder: "Select property type",
                  onChange: (e) =>
                    handleFormChange("propertyType", e.target.value),
                  error: fieldErrors["physicalDetails.propertyType"],
                  disabled: isPending,
                })}
                <Input
                  label="Estimated Duration"
                  value={formState.estimatedDuration}
                  onChange={(e) =>
                    handleFormChange("estimatedDuration", e.target.value)
                  }
                  placeholder="2 hours, 1 day, 3 visits..."
                  disabled={isPending}
                  error={fieldErrors["physicalDetails.estimatedDuration"]}
                />
              </div>
              <div className="job-form-grid job-form-grid-2">
                <Input
                  label="Preferred Visit Date"
                  type="date"
                  value={formState.preferredVisitDate}
                  onChange={(e) =>
                    handleFormChange("preferredVisitDate", e.target.value)
                  }
                  disabled={isPending}
                  error={fieldErrors["physicalDetails.preferredVisitDate"]}
                />
                <Input
                  label="Preferred Work Date"
                  type="date"
                  value={formState.preferredWorkDate}
                  onChange={(e) =>
                    handleFormChange("preferredWorkDate", e.target.value)
                  }
                  disabled={isPending}
                  error={fieldErrors["physicalDetails.preferredWorkDate"]}
                />
              </div>
              <div className="job-form-grid job-form-grid-2">
                {renderSelect({
                  id: "materialsPreference",
                  label: "Materials",
                  value: formState.materialsPreference,
                  options: [
                    { value: "client", label: "Client provides" },
                    { value: "freelancer", label: "Freelancer provides" },
                    { value: "shared", label: "Shared" },
                  ],
                  placeholder: "Select material responsibility",
                  onChange: (e) =>
                    handleFormChange("materialsPreference", e.target.value),
                  disabled: isPending,
                })}
                <div className="job-form-inline-panel">
                  <label
                    htmlFor="siteVisitRequired"
                    className="job-form-checkbox"
                  >
                    <input
                      type="checkbox"
                      id="siteVisitRequired"
                      checked={formState.siteVisitRequired}
                      onChange={(e) =>
                        handleFormChange("siteVisitRequired", e.target.checked)
                      }
                      disabled={isPending}
                    />
                    <span>
                      <strong>Site visit required</strong>
                      <small>
                        Use this if the freelancer should inspect before final
                        pricing.
                      </small>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="job-form-subsection">
              <h4 className="job-form-subsection-title">
                Access and safety notes
              </h4>
              <label htmlFor="safetyNotes" className="form-label">
                Safety / Access Notes
              </label>
              <textarea
                id="safetyNotes"
                value={formState.safetyNotes}
                onChange={(e) =>
                  handleFormChange("safetyNotes", e.target.value)
                }
                rows={4}
                disabled={isPending}
                className="form-input"
                placeholder="Mention parking, access hours, staircase/elevator info, equipment restrictions, or any important safety detail."
              />
            </div>
          </div>
        ) : (
          <div className="job-form-digital-panel">
            <div className="job-form-digital-card">
              <h4 className="job-form-subsection-title">
                Tips for a polished digital brief
              </h4>
              <ul className="job-form-bullet-list">
                <li>Explain the final deliverable clearly.</li>
                <li>
                  Mention tools, platforms, or file formats if they matter.
                </li>
                <li>Upload sample files, screenshots, or references below.</li>
              </ul>
            </div>
            <div className="job-form-digital-card">
              <h4 className="job-form-subsection-title">
                Example digital jobs
              </h4>
              <p className="job-form-helper" style={{ marginTop: 0 }}>
                Landing page redesign, logo package, social media content plan,
                SEO audit, mobile app fixes, dashboard UI cleanup.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 5</p>
            <h3 className="job-form-section-title">Attachments</h3>
            <p className="job-form-section-copy">
              Upload references, briefs, drawings, photos, or supporting
              documents.
            </p>
          </div>
        </div>
        <CloudinaryFileUploader
          buttonLabel="Upload Job Attachment"
          disabled={isPending}
          folder="job-attachments"
          onUploaded={handleUploadedAttachment}
        />
        {formState.attachments.length > 0 ? (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {formState.attachments.map((attachment, index) => (
              <div key={attachment.id} className="card-sm">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {attachment.name || `Attachment ${index + 1}`}
                    </strong>
                    <p className="text-light" style={{ margin: 0 }}>
                      {attachment.resourceType || "raw"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-light">No job attachments uploaded yet.</p>
        )}
        {fieldErrors.attachments && (
          <p className="form-error" style={{ marginTop: "var(--space-2)" }}>
            {fieldErrors.attachments}
          </p>
        )}
      </div>

      <div
        style={{
          marginTop: "var(--space-4)",
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="submit"
          className="btn btn-ghost"
          name="intent"
          value="draft"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          name="intent"
          value="open"
          disabled={isPending}
        >
          {isPending ? "Posting..." : "Post Job"}
        </button>
      </div>
    </form>
  );
}
