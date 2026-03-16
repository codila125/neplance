"use client";

import { useActionState, useState } from "react";
import { createJobAction } from "@/lib/actions/jobs";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Input } from "@/shared/components/UI";
import {
  JOB_CATEGORIES,
  NEPAL_PROVINCES,
} from "@/shared/constants/jobCategories";
import { JOB_STATUS } from "@/shared/constants/statuses";

export function ClientPostJobSection() {
  const [submitIntent, setSubmitIntent] = useState("open");
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    jobType: "digital",
    category: "",
    subcategory: "",
    tags: "",
    requiredSkills: "",
    experienceLevel: "",
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    isUrgent: false,
    locationCity: "",
    locationDistrict: "",
    locationProvince: "",
    attachments: [],
    milestones: [
      { id: Date.now(), title: "", description: "", value: "", dueDate: "" },
    ],
  });
  const [actionState, formAction, isPending] = useActionState(createJobAction, {
    message: "",
    errors: [],
    milestoneErrors: {},
  });
  const formErrors = actionState?.errors || [];
  const milestoneErrors = actionState?.milestoneErrors || {};

  const formatDateValue = (value) => {
    if (!value) return null;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormState((prev) => {
      const updated = [...prev.milestones];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, milestones: updated };
    });
  };

  const addMilestone = () => {
    setFormState((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { id: Date.now(), title: "", description: "", value: "", dueDate: "" },
      ],
    }));
  };

  const removeMilestone = (index) => {
    setFormState((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, idx) => idx !== index),
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

  const buildJobPayload = (status, { includeMilestones = true } = {}) => {
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
            city: formState.locationCity.trim() || undefined,
            district: formState.locationDistrict.trim() || undefined,
            province: formState.locationProvince.trim() || undefined,
          }
        : undefined;

    const milestones = includeMilestones
      ? formState.milestones
          .filter((m) => m.title.trim())
          .map((m) => ({
            title: m.title.trim(),
            description: m.description.trim(),
            value: Number(m.value) || 0,
            dueDate: formatDateValue(m.dueDate),
          }))
      : [];

    return {
      title: formState.title.trim(),
      description: formState.description.trim(),
      jobType: formState.jobType,
      category: formState.category.trim(),
      subcategory: formState.subcategory.trim() || undefined,
      tags,
      requiredSkills,
      experienceLevel: formState.experienceLevel || undefined,
      budgetType: formState.budgetType,
      budget: {
        min: Number(formState.budgetMin) || 0,
        max: formState.budgetMax ? Number(formState.budgetMax) : undefined,
        currency: "NPR",
      },
      deadline: formState.deadline || undefined,
      isUrgent: formState.isUrgent,
      location,
      milestones,
      attachments: formState.attachments.map((attachment) => attachment.url),
      status,
      isPublic: true,
    };
  };

  return (
    <form className="card" action={formAction}>
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify(
          buildJobPayload(
            submitIntent === "draft" ? JOB_STATUS.DRAFT : JOB_STATUS.OPEN,
            {
              includeMilestones: submitIntent !== "draft",
            },
          ),
        )}
      />
      <input type="hidden" name="intent" value={submitIntent} />
      {actionState?.message && (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          <p style={{ margin: 0 }}>{actionState.message}</p>
        </div>
      )}
      {formErrors.length > 0 && (
        <div className="card-error" style={{ marginBottom: "var(--space-4)" }}>
          {formErrors.map((error) => (
            <p key={error} style={{ margin: 0 }}>
              {error}
            </p>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1", minWidth: "200px" }}>
          <Input
            label="Contract Title"
            value={formState.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
            placeholder="e.g. Landing page redesign"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <Input
        label="Description"
        value={formState.description}
        onChange={(e) => handleFormChange("description", e.target.value)}
        placeholder="Describe the work scope"
        disabled={isPending}
      />

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1", minWidth: "150px" }}>
          <label
            htmlFor="jobType"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Job Type
          </label>
          <select
            id="jobType"
            value={formState.jobType}
            onChange={(e) => handleFormChange("jobType", e.target.value)}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "var(--space-2)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
        </div>
        <div style={{ flex: "2", minWidth: "200px" }}>
          <label
            htmlFor="category"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Category <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <select
            id="category"
            value={formState.category}
            onChange={(e) => handleFormChange("category", e.target.value)}
            disabled={isPending}
            required
            style={{
              width: "100%",
              padding: "var(--space-2)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <option value="">Select Category</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <Input
            label="Subcategory"
            value={formState.subcategory}
            onChange={(e) => handleFormChange("subcategory", e.target.value)}
            placeholder="e.g. Frontend"
            disabled={isPending}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1", minWidth: "200px" }}>
          <Input
            label="Tags (comma separated)"
            value={formState.tags}
            onChange={(e) => handleFormChange("tags", e.target.value)}
            placeholder="e.g. React, Node.js, MongoDB"
            disabled={isPending}
          />
        </div>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <Input
            label="Required Skills (comma separated)"
            value={formState.requiredSkills}
            onChange={(e) => handleFormChange("requiredSkills", e.target.value)}
            placeholder="e.g. JavaScript, CSS"
            disabled={isPending}
          />
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <label
            htmlFor="experienceLevel"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Experience Level
          </label>
          <select
            id="experienceLevel"
            value={formState.experienceLevel}
            onChange={(e) =>
              handleFormChange("experienceLevel", e.target.value)
            }
            disabled={isPending}
            style={{
              width: "100%",
              padding: "var(--space-2)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <option value="">Any</option>
            <option value="entry">Entry Level</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1", minWidth: "120px" }}>
          <label
            htmlFor="budgetType"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Budget Type
          </label>
          <select
            id="budgetType"
            value={formState.budgetType}
            onChange={(e) => handleFormChange("budgetType", e.target.value)}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "var(--space-2)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--color-border)",
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <Input
            label="Budget Min (NPR)"
            type="number"
            value={formState.budgetMin}
            onChange={(e) => handleFormChange("budgetMin", e.target.value)}
            placeholder="5000"
            required
            disabled={isPending}
          />
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <Input
            label="Budget Max (NPR)"
            type="number"
            value={formState.budgetMax}
            onChange={(e) => handleFormChange("budgetMax", e.target.value)}
            placeholder="10000"
            disabled={isPending}
          />
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <Input
            label="Deadline"
            type="date"
            value={formState.deadline}
            onChange={(e) => handleFormChange("deadline", e.target.value)}
            disabled={isPending}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-1)",
          }}
        >
          <input
            type="checkbox"
            id="isUrgent"
            checked={formState.isUrgent}
            onChange={(e) => handleFormChange("isUrgent", e.target.checked)}
            disabled={isPending}
          />
          <label htmlFor="isUrgent" style={{ cursor: "pointer" }}>
            Urgent
          </label>
        </div>
      </div>

      {formState.jobType === "physical" && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            padding: "var(--space-3)",
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ flex: "1", minWidth: "150px" }}>
            <Input
              label="City"
              value={formState.locationCity}
              onChange={(e) => handleFormChange("locationCity", e.target.value)}
              placeholder="Kathmandu"
              disabled={isPending}
            />
          </div>
          <div style={{ flex: "1", minWidth: "150px" }}>
            <Input
              label="District"
              value={formState.locationDistrict}
              onChange={(e) =>
                handleFormChange("locationDistrict", e.target.value)
              }
              placeholder="Kathmandu"
              disabled={isPending}
            />
          </div>
          <div style={{ flex: "1", minWidth: "150px" }}>
            <label
              htmlFor="locationProvince"
              style={{
                display: "block",
                marginBottom: "var(--space-1)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              Province
            </label>
            <select
              id="locationProvince"
              value={formState.locationProvince}
              onChange={(e) =>
                handleFormChange("locationProvince", e.target.value)
              }
              disabled={isPending}
              style={{
                width: "100%",
                padding: "var(--space-2)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--color-border)",
              }}
            >
              <option value="">Select Province</option>
              {NEPAL_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <strong>Job Attachments</strong>
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
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <strong>Milestones</strong>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={addMilestone}
          >
            + Add milestone
          </button>
        </div>

        {formState.milestones.map((milestone, index) => (
          <div key={milestone.id} className="card-sm">
            {milestoneErrors[index] && (
              <div
                className="card-error"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {milestoneErrors[index].map((error) => (
                  <p key={error} style={{ margin: 0 }}>
                    {error}
                  </p>
                ))}
              </div>
            )}
            <Input
              label="Title"
              value={milestone.title}
              onChange={(e) =>
                handleMilestoneChange(index, "title", e.target.value)
              }
              disabled={isPending}
            />
            <Input
              label="Description"
              value={milestone.description}
              onChange={(e) =>
                handleMilestoneChange(index, "description", e.target.value)
              }
              disabled={isPending}
            />
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <Input
                label="Value (NPR)"
                type="number"
                value={milestone.value}
                onChange={(e) =>
                  handleMilestoneChange(index, "value", e.target.value)
                }
                disabled={isPending}
              />
              <Input
                label="Due Date"
                type="date"
                value={milestone.dueDate}
                onChange={(e) =>
                  handleMilestoneChange(index, "dueDate", e.target.value)
                }
                disabled={isPending}
              />
            </div>
            {formState.milestones.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeMilestone(index)}
                style={{ marginTop: "var(--space-2)" }}
              >
                Remove milestone
              </button>
            )}
          </div>
        ))}
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
          type="button"
          className="btn btn-ghost"
          onClick={() => setSubmitIntent("draft")}
          disabled={isPending}
        >
          {isPending && submitIntent === "draft"
            ? "Saving..."
            : "Save as Draft"}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => setSubmitIntent("open")}
        >
          {isPending && submitIntent === "open" ? "Posting..." : "Post Job"}
        </button>
      </div>
    </form>
  );
}
