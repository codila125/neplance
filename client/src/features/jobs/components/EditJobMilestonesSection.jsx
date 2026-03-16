import { Input } from "@/shared/components/UI";

export function EditJobMilestonesSection({
  addMilestone,
  formState,
  handleMilestoneChange,
  isPending,
  milestoneErrors,
  removeMilestone,
}) {
  return (
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
            onChange={(event) =>
              handleMilestoneChange(index, "title", event.target.value)
            }
            disabled={isPending}
          />
          <Input
            label="Description"
            value={milestone.description}
            onChange={(event) =>
              handleMilestoneChange(index, "description", event.target.value)
            }
            disabled={isPending}
          />
          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <Input
              label="Value (NPR)"
              type="number"
              value={milestone.value}
              onChange={(event) =>
                handleMilestoneChange(index, "value", event.target.value)
              }
              disabled={isPending}
            />
            <Input
              label="Due Date"
              type="date"
              value={milestone.dueDate}
              onChange={(event) =>
                handleMilestoneChange(index, "dueDate", event.target.value)
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
  );
}
