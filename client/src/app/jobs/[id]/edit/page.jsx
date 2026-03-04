"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/services/api";
import {
  JOB_CATEGORIES,
  NEPAL_PROVINCES,
} from "@/shared/constants/jobCategories";
import { JOB_STATUS } from "@/shared/constants/statuses";
import { useAuthGate } from "@/shared/hooks/useAuthGate";
import { jobCreateSchema, validateForm } from "@/shared/lib/validation";
import { Navbar } from "@/shared/navigation/Navbar";
import { Button, Input } from "@/shared/ui/UI";

export default function EditJobPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { user, isHydrated, logout, switchRole } = useAuthGate({
    mode: "require-auth",
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [milestoneErrors, setMilestoneErrors] = useState({});
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
    milestones: [],
  });

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      setLoading(false);
      router.push("/");
      return;
    }

    if (!id) {
      setLoadError("Invalid job id.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await apiCall(`/api/jobs/${id}`);
        const job = response.data;

        const userId = user.id || user._id;

        const creatorId = job.creatorAddress?._id || job.creatorAddress;
        if (creatorId?.toString() !== userId?.toString()) {
          router.push("/dashboard");
          return;
        }

        if (![JOB_STATUS.DRAFT, JOB_STATUS.OPEN].includes(job.status)) {
          router.push("/dashboard");
          return;
        }

        setFormState({
          title: job.title || "",
          description: job.description || "",
          jobType: job.jobType || "digital",
          category: job.category || "",
          subcategory: job.subcategory || "",
          tags: (job.tags || []).join(", "),
          requiredSkills: (job.requiredSkills || []).join(", "),
          experienceLevel: job.experienceLevel || "",
          budgetType: job.budgetType || "fixed",
          budgetMin: job.budget?.min?.toString() || "",
          budgetMax: job.budget?.max?.toString() || "",
          deadline: job.deadline ? job.deadline.split("T")[0] : "",
          isUrgent: job.isUrgent || false,
          locationCity: job.location?.city || "",
          locationDistrict: job.location?.district || "",
          locationProvince: job.location?.province || "",
          milestones: (job.milestones || []).map((m) => ({
            id: Date.now() + Math.random(),
            title: m.title || "",
            description: m.description || "",
            value: m.value?.toString() || "",
            dueDate: m.dueDate
              ? new Date(m.dueDate).toISOString().split("T")[0]
              : "",
          })),
        });
      } catch (err) {
        console.error("Failed to load job:", err);
        setLoadError(err?.message || "Failed to load job.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isHydrated, user, id, router]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const milestones = formState.milestones
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title.trim(),
        description: m.description.trim(),
        value: Number(m.value) || 0,
        dueDate: m.dueDate ? new Date(m.dueDate).getTime() : undefined,
      }));

    const payload = {
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
    };

    const { errors: validationErrors } = validateForm(jobCreateSchema, payload);
    if (validationErrors) {
      const flatErrors = [];
      const milestoneErrorsObj = {};

      Object.entries(validationErrors).forEach(([key, value]) => {
        if (key.startsWith("milestones.")) {
          const match = key.match(/milestones\.(\d+)\.(.+)/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (!milestoneErrorsObj[idx]) milestoneErrorsObj[idx] = [];
            milestoneErrorsObj[idx].push(value);
          }
        } else {
          flatErrors.push(value);
        }
      });

      setFormErrors(flatErrors);
      setMilestoneErrors(milestoneErrorsObj);
      return;
    }

    setSubmitting(true);
    setFormErrors([]);
    try {
      await apiCall(`/api/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to update job:", err);
      setFormErrors([
        err?.message || "Failed to update job. Please try again.",
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "var(--space-6)",
        }}
      >
        <div className="card" style={{ maxWidth: "520px", width: "100%" }}>
          <h2 style={{ marginBottom: "var(--space-2)" }}>Unable to load job</h2>
          <p className="text-light" style={{ marginBottom: "var(--space-4)" }}>
            {loadError}
          </p>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={logout} onRoleSwitch={switchRole} />

      <div className="dashboard">
        <div className="dashboard-content">
          <div style={{ marginBottom: "var(--space-6)" }}>
            <Link href="/dashboard" className="btn btn-ghost">
              ← Back to Dashboard
            </Link>
          </div>

          <h1 style={{ marginBottom: "var(--space-6)" }}>Edit Job</h1>

          <form className="card" onSubmit={handleSubmit}>
            {formErrors.length > 0 && (
              <div
                className="card-error"
                style={{ marginBottom: "var(--space-4)" }}
              >
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
                  label="Job Title"
                  value={formState.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="e.g. Landing page redesign"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <Input
              label="Description"
              value={formState.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              placeholder="Describe the work scope"
              disabled={submitting}
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
                  disabled={submitting}
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
                  Category{" "}
                  <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <select
                  id="category"
                  value={formState.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                  disabled={submitting}
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
                  onChange={(e) =>
                    handleFormChange("subcategory", e.target.value)
                  }
                  placeholder="e.g. Frontend"
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <Input
                  label="Required Skills (comma separated)"
                  value={formState.requiredSkills}
                  onChange={(e) =>
                    handleFormChange("requiredSkills", e.target.value)
                  }
                  placeholder="e.g. JavaScript, CSS"
                  disabled={submitting}
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
                  disabled={submitting}
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
                  onChange={(e) =>
                    handleFormChange("budgetType", e.target.value)
                  }
                  disabled={submitting}
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
                  onChange={(e) =>
                    handleFormChange("budgetMin", e.target.value)
                  }
                  placeholder="5000"
                  required
                  disabled={submitting}
                />
              </div>
              <div style={{ flex: "1", minWidth: "150px" }}>
                <Input
                  label="Budget Max (NPR)"
                  type="number"
                  value={formState.budgetMax}
                  onChange={(e) =>
                    handleFormChange("budgetMax", e.target.value)
                  }
                  placeholder="10000"
                  disabled={submitting}
                />
              </div>
              <div style={{ flex: "1", minWidth: "150px" }}>
                <Input
                  label="Deadline"
                  type="date"
                  value={formState.deadline}
                  onChange={(e) => handleFormChange("deadline", e.target.value)}
                  disabled={submitting}
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
                  onChange={(e) =>
                    handleFormChange("isUrgent", e.target.checked)
                  }
                  disabled={submitting}
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
                    onChange={(e) =>
                      handleFormChange("locationCity", e.target.value)
                    }
                    placeholder="Kathmandu"
                    disabled={submitting}
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                  <Input
                    label="Description"
                    value={milestone.description}
                    onChange={(e) =>
                      handleMilestoneChange(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    disabled={submitting}
                  />
                  <div style={{ display: "flex", gap: "var(--space-4)" }}>
                    <Input
                      label="Value (NPR)"
                      type="number"
                      value={milestone.value}
                      onChange={(e) =>
                        handleMilestoneChange(index, "value", e.target.value)
                      }
                      disabled={submitting}
                    />
                    <Input
                      label="Due Date"
                      type="date"
                      value={milestone.dueDate}
                      onChange={(e) =>
                        handleMilestoneChange(index, "dueDate", e.target.value)
                      }
                      disabled={submitting}
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
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/dashboard")}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
