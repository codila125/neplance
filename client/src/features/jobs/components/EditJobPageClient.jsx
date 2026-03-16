"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { EditJobFormSection } from "@/features/jobs/components/EditJobFormSection";
import { EditJobMilestonesSection } from "@/features/jobs/components/EditJobMilestonesSection";
import { updateJobAction } from "@/lib/actions/jobs";
import { Button } from "@/shared/components/UI";

const createMilestoneId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const buildInitialFormState = (job) => ({
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
  attachments: Array.isArray(job.attachments)
    ? job.attachments.map((attachment, index) => ({
        id: createMilestoneId(),
        name: `Attachment ${index + 1}`,
        url: attachment,
        publicId: "",
        resourceType: "raw",
      }))
    : [],
  milestones: (job.milestones || []).map((milestone) => ({
    id: createMilestoneId(),
    title: milestone.title || "",
    description: milestone.description || "",
    value: milestone.value?.toString() || "",
    dueDate: milestone.dueDate
      ? new Date(milestone.dueDate).toISOString().split("T")[0]
      : "",
  })),
});

const INITIAL_ACTION_STATE = {
  message: "",
  errors: [],
  milestoneErrors: {},
};

export function EditJobPageClient({ initialJob }) {
  const router = useRouter();
  const [formState, setFormState] = useState(buildInitialFormState(initialJob));
  const [actionState, formAction, isPending] = useActionState(
    updateJobAction.bind(null, initialJob._id),
    INITIAL_ACTION_STATE,
  );

  const formErrors = actionState?.errors || [];
  const milestoneErrors = actionState?.milestoneErrors || {};

  const handleFormChange = (field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormState((previous) => {
      const nextMilestones = [...previous.milestones];
      nextMilestones[index] = { ...nextMilestones[index], [field]: value };
      return { ...previous, milestones: nextMilestones };
    });
  };

  const addMilestone = () => {
    setFormState((previous) => ({
      ...previous,
      milestones: [
        ...previous.milestones,
        {
          id: createMilestoneId(),
          title: "",
          description: "",
          value: "",
          dueDate: "",
        },
      ],
    }));
  };

  const removeMilestone = (index) => {
    setFormState((previous) => ({
      ...previous,
      milestones: previous.milestones.filter(
        (_, milestoneIndex) => milestoneIndex !== index,
      ),
    }));
  };

  const handleUploadedAttachment = (attachment) => {
    setFormState((previous) => ({
      ...previous,
      attachments: [
        ...previous.attachments,
        {
          id: createMilestoneId(),
          name: attachment.name || "",
          url: attachment.url,
          publicId: attachment.publicId || "",
          resourceType: attachment.resourceType || "raw",
        },
      ],
    }));
  };

  const removeAttachment = (index) => {
    setFormState((previous) => ({
      ...previous,
      attachments: previous.attachments.filter(
        (_, attachmentIndex) => attachmentIndex !== index,
      ),
    }));
  };

  const serializedPayload = JSON.stringify(formState);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div style={{ marginBottom: "var(--space-6)" }}>
          <Link href="/dashboard" className="btn btn-ghost">
            Back to Dashboard
          </Link>
        </div>

        <h1 style={{ marginBottom: "var(--space-6)" }}>Edit Job</h1>

        <form className="card" action={formAction}>
          <input type="hidden" name="payload" value={serializedPayload} />

          {actionState?.message && (
            <div
              className="card-error"
              style={{ marginBottom: "var(--space-4)" }}
            >
              <p style={{ margin: 0 }}>{actionState.message}</p>
            </div>
          )}

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

          <EditJobFormSection
            formState={formState}
            handleFormChange={handleFormChange}
            handleUploadedAttachment={handleUploadedAttachment}
            isPending={isPending}
            removeAttachment={removeAttachment}
          />
          <EditJobMilestonesSection
            addMilestone={addMilestone}
            formState={formState}
            handleMilestoneChange={handleMilestoneChange}
            isPending={isPending}
            milestoneErrors={milestoneErrors}
            removeMilestone={removeMilestone}
          />

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
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/dashboard")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
