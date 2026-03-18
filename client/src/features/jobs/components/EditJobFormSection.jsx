import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { Input } from "@/shared/components/UI";
import {
  JOB_CATEGORIES,
  NEPAL_PROVINCES,
} from "@/shared/constants/jobCategories";

export function EditJobFormSection({
  formState,
  handleFormChange,
  handleUploadedAttachment,
  isPending,
  removeAttachment,
}) {
  return (
    <>
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
            onChange={(event) => handleFormChange("title", event.target.value)}
            placeholder="e.g. Landing page redesign"
            required
            disabled={isPending}
          />
        </div>
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
            onChange={(event) =>
              handleFormChange("jobType", event.target.value)
            }
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
            onChange={(event) =>
              handleFormChange("category", event.target.value)
            }
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
            {JOB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
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

      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <Input
            label="Tags (comma separated)"
            value={formState.tags}
            onChange={(event) => handleFormChange("tags", event.target.value)}
            placeholder="e.g. React, Node.js, MongoDB"
            disabled={isPending}
          />
        </div>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <Input
            label="Required Skills (comma separated)"
            value={formState.requiredSkills}
            onChange={(event) =>
              handleFormChange("requiredSkills", event.target.value)
            }
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
            onChange={(event) =>
              handleFormChange("experienceLevel", event.target.value)
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
        <div style={{ flex: "1", minWidth: "150px" }}>
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
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
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
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
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
            onChange={(event) =>
              handleFormChange("isUrgent", event.target.checked)
            }
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
              onChange={(event) =>
                handleFormChange("locationCity", event.target.value)
              }
              placeholder="Kathmandu"
              disabled={isPending}
            />
          </div>
          <div style={{ flex: "1", minWidth: "150px" }}>
            <Input
              label="District"
              value={formState.locationDistrict}
              onChange={(event) =>
                handleFormChange("locationDistrict", event.target.value)
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
              onChange={(event) =>
                handleFormChange("locationProvince", event.target.value)
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
