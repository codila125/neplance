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
  disabled,
  helperText,
}) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="form-select"
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
  </div>
);

export function EditJobFormSection({
  formState,
  handleFormChange,
  handleUploadedAttachment,
  isPending,
  removeAttachment,
}) {
  const handleDistrictChange = (district) => {
    const province = DISTRICT_TO_PROVINCE[district] || "";
    handleFormChange("locationDistrict", district);
    if (province) {
      handleFormChange("locationProvince", province);
    }
  };

  return (
    <>
      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 1</p>
            <h3 className="job-form-section-title">Job basics</h3>
            <p className="job-form-section-copy">
              Keep the title, description, and category tidy and easy to scan.
            </p>
          </div>
        </div>
        <div className="job-form-grid job-form-grid-single">
          <Input
            label="Job Title"
            value={formState.title}
            onChange={(event) => handleFormChange("title", event.target.value)}
            placeholder="e.g. Landing page redesign"
            required
            disabled={isPending}
          />
        </div>
        <Input
          label="Description"
          value={formState.description}
          onChange={(event) =>
            handleFormChange("description", event.target.value)
          }
          placeholder="Describe the work scope"
          disabled={isPending}
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
            onChange: (event) =>
              handleFormChange("jobType", event.target.value),
            disabled: isPending,
          })}
          {renderSelect({
            id: "category",
            label: "Category",
            value: formState.category,
            options: JOB_CATEGORIES,
            placeholder: "Select category",
            onChange: (event) =>
              handleFormChange("category", event.target.value),
            disabled: isPending,
          })}
          <Input
            label="Subcategory"
            value={formState.subcategory}
            onChange={(event) =>
              handleFormChange("subcategory", event.target.value)
            }
            placeholder="e.g. Frontend"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="job-form-section">
        <div className="job-form-section-header">
          <div>
            <p className="job-form-section-eyebrow">Step 2</p>
            <h3 className="job-form-section-title">Skills and scope</h3>
            <p className="job-form-section-copy">
              Make the skill expectations clear so the right freelancers can
              respond.
            </p>
          </div>
        </div>
        <div className="job-form-grid job-form-grid-3">
          <Input
            label="Tags (comma separated)"
            value={formState.tags}
            onChange={(event) => handleFormChange("tags", event.target.value)}
            placeholder="e.g. React, Node.js, MongoDB"
            disabled={isPending}
          />
          <Input
            label="Required Skills (comma separated)"
            value={formState.requiredSkills}
            onChange={(event) =>
              handleFormChange("requiredSkills", event.target.value)
            }
            placeholder="e.g. JavaScript, CSS"
            disabled={isPending}
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
            onChange: (event) =>
              handleFormChange("experienceLevel", event.target.value),
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
              Keep pricing and deadlines grouped in one clean row.
            </p>
          </div>
        </div>
        <div className="job-form-grid job-form-grid-4">
          <Input
            label="Budget Min (NPR)"
            type="number"
            value={formState.budgetMin}
            onChange={(event) =>
              handleFormChange("budgetMin", event.target.value)
            }
            placeholder="5000"
            required
            disabled={isPending}
          />
          <Input
            label="Budget Max (NPR)"
            type="number"
            value={formState.budgetMax}
            onChange={(event) =>
              handleFormChange("budgetMax", event.target.value)
            }
            placeholder="10000"
            disabled={isPending}
          />
          {renderSelect({
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
            onChange: (event) =>
              handleFormChange("budgetType", event.target.value),
            disabled: isPending,
          })}
          <Input
            label="Deadline"
            type="date"
            value={formState.deadline}
            onChange={(event) =>
              handleFormChange("deadline", event.target.value)
            }
            disabled={isPending}
          />
        </div>
        <div className="job-form-toggle-row">
          <label htmlFor="isUrgent" className="job-form-checkbox">
            <input
              type="checkbox"
              id="isUrgent"
              checked={formState.isUrgent}
              onChange={(event) =>
                handleFormChange("isUrgent", event.target.checked)
              }
              disabled={isPending}
            />
            <span>
              <strong>Mark this job as urgent</strong>
              <small>Use this if you need faster responses.</small>
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
                ? "Use the dropdowns and grouped fields to keep location and property details neat."
                : "For digital jobs, keep the brief focused and use attachments for supporting files."}
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
                  onChange: (event) =>
                    handleFormChange("locationCity", event.target.value),
                  disabled: isPending,
                })}
                {renderSelect({
                  id: "locationDistrict",
                  label: "District",
                  value: formState.locationDistrict,
                  options: NEPAL_DISTRICTS,
                  placeholder: "Select district",
                  onChange: (event) => handleDistrictChange(event.target.value),
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
                  onChange: (event) =>
                    handleFormChange("locationProvince", event.target.value),
                  disabled: isPending,
                })}
                <Input
                  label="Address / Landmark"
                  value={formState.locationAddress}
                  onChange={(event) =>
                    handleFormChange("locationAddress", event.target.value)
                  }
                  placeholder="House no., street, nearby landmark"
                  disabled={isPending}
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
                  onChange: (event) =>
                    handleFormChange("propertyType", event.target.value),
                  disabled: isPending,
                })}
                <Input
                  label="Estimated Duration"
                  value={formState.estimatedDuration}
                  onChange={(event) =>
                    handleFormChange("estimatedDuration", event.target.value)
                  }
                  placeholder="2 hours, 1 day..."
                  disabled={isPending}
                />
              </div>
              <div className="job-form-grid job-form-grid-2">
                <Input
                  label="Preferred Visit Date"
                  type="date"
                  value={formState.preferredVisitDate}
                  onChange={(event) =>
                    handleFormChange("preferredVisitDate", event.target.value)
                  }
                  disabled={isPending}
                />
                <Input
                  label="Preferred Work Date"
                  type="date"
                  value={formState.preferredWorkDate}
                  onChange={(event) =>
                    handleFormChange("preferredWorkDate", event.target.value)
                  }
                  disabled={isPending}
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
                  onChange: (event) =>
                    handleFormChange("materialsPreference", event.target.value),
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
                      onChange={(event) =>
                        handleFormChange(
                          "siteVisitRequired",
                          event.target.checked,
                        )
                      }
                      disabled={isPending}
                    />
                    <span>
                      <strong>Site visit required</strong>
                      <small>
                        Ask for an inspection before finalizing scope.
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
                onChange={(event) =>
                  handleFormChange("safetyNotes", event.target.value)
                }
                rows={4}
                disabled={isPending}
                className="form-input"
                placeholder="Mention parking, access restrictions, or safety information."
              />
            </div>
          </div>
        ) : (
          <div className="job-form-digital-panel">
            <div className="job-form-digital-card">
              <h4 className="job-form-subsection-title">Digital job polish</h4>
              <ul className="job-form-bullet-list">
                <li>Be clear about the final deliverable.</li>
                <li>List tools or platforms if required.</li>
                <li>Use attachments for examples and references.</li>
              </ul>
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
              Add any supporting files that help explain the work.
            </p>
          </div>
        </div>
        <CloudinaryFileUploader
          buttonLabel="Upload Job Attachment"
          disabled={isPending}
          folder="job-attachments"
          onUploaded={handleUploadedAttachment}
        />
        {formState.attachments?.length > 0 ? (
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
    </>
  );
}
