"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";
import { getJobByIdServer } from "@/lib/server/jobs";
import { JOB_STATUS } from "@/shared/constants/statuses";
import { jobCreateSchema, validateForm } from "@/shared/validation";

const INITIAL_JOB_ACTION_STATE = {
  message: "",
  errors: [],
};

const parsePayload = (formData) => {
  const rawPayload = String(formData.get("payload") || "");

  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload);
  } catch {
    return null;
  }
};

const sanitizeAttachments = (attachments = []) =>
  (Array.isArray(attachments) ? attachments : [])
    .map((attachment) => {
      if (typeof attachment === "string") {
        return attachment.trim();
      }

      return attachment?.url?.trim() || "";
    })
    .filter(Boolean);

const mapValidationErrors = (validationErrors) => {
  const errors = [];
  Object.entries(validationErrors).forEach(([_key, value]) => {
    errors.push(value);
  });

  return { errors };
};

export async function createJobAction(_previousState, formData) {
  await requireSession();
  const payload = parsePayload(formData);
  const intent = String(formData.get("intent") || "open");

  if (!payload) {
    return {
      ...INITIAL_JOB_ACTION_STATE,
      message: "Invalid job submission.",
    };
  }

  if (intent === "draft") {
    const draftPayload = {
      ...payload,
      attachments: sanitizeAttachments(payload.attachments),
    };
    const title = payload.title?.trim() || "";

    if (!title) {
      return {
        ...INITIAL_JOB_ACTION_STATE,
        errors: ["Job title is required to save as draft."],
      };
    }

    if (title.length < 5) {
      return {
        ...INITIAL_JOB_ACTION_STATE,
        errors: ["Job title must be at least 5 characters."],
      };
    }

    try {
      await apiServerRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify(draftPayload),
      });
    } catch (error) {
      return {
        ...INITIAL_JOB_ACTION_STATE,
        message: error.message || "Failed to save draft.",
      };
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const { errors: validationErrors, data } = validateForm(jobCreateSchema, {
    ...payload,
    attachments: sanitizeAttachments(payload.attachments),
  });

  if (validationErrors) {
    return {
      message: "Please fix the highlighted fields.",
      ...mapValidationErrors(validationErrors),
    };
  }

  try {
    await apiServerRequest("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      ...INITIAL_JOB_ACTION_STATE,
      message: error.message || "Failed to post job.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateJobAction(jobId, _previousState, formData) {
  const { user } = await requireSession();
  const existingJob = await getJobByIdServer(jobId);

  if (!existingJob) {
    return {
      ...INITIAL_JOB_ACTION_STATE,
      message: "Job not found.",
    };
  }

  const creatorId =
    existingJob.creatorAddress?._id || existingJob.creatorAddress;
  const userId = user.id || user._id;

  if (String(creatorId) !== String(userId)) {
    redirect("/dashboard");
  }

  if (![JOB_STATUS.DRAFT, JOB_STATUS.OPEN].includes(existingJob.status)) {
    redirect("/dashboard");
  }

  const payload = parsePayload(formData);

  if (!payload) {
    return {
      ...INITIAL_JOB_ACTION_STATE,
      message: "Invalid job submission.",
    };
  }

  const tags = (payload.tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requiredSkills = (payload.requiredSkills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const location =
    payload.jobType === "physical"
      ? {
          city: payload.locationCity?.trim() || undefined,
          district: payload.locationDistrict?.trim() || undefined,
          province: payload.locationProvince?.trim() || undefined,
        }
      : undefined;
  const submitData = {
    title: payload.title?.trim() || "",
    description: payload.description?.trim() || "",
    jobType: payload.jobType || "digital",
    category: payload.category?.trim() || "",
    subcategory: payload.subcategory?.trim() || undefined,
    tags,
    requiredSkills,
    experienceLevel: payload.experienceLevel || undefined,
    budget: {
      min: Number(payload.budgetMin) || 0,
      max: payload.budgetMax ? Number(payload.budgetMax) : undefined,
      currency: "NPR",
    },
    deadline: payload.deadline || undefined,
    isUrgent: Boolean(payload.isUrgent),
    location,
    attachments: sanitizeAttachments(payload.attachments),
  };

  const { errors: validationErrors, data } = validateForm(
    jobCreateSchema,
    submitData,
  );

  if (validationErrors) {
    const mappedErrors = mapValidationErrors(validationErrors);
    return {
      message: "Please fix the highlighted fields.",
      ...mappedErrors,
    };
  }

  try {
    await apiServerRequest(`/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      ...INITIAL_JOB_ACTION_STATE,
      message: error.message || "Failed to update job.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/edit`);
  redirect("/dashboard");
}
export async function publishJobAction(jobId) {
  await requireSession();

  await apiServerRequest(`/api/jobs/${jobId}/publish`, {
    method: "PATCH",
  });

  const job = await getJobByIdServer(jobId);

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${jobId}`);

  return successResult(job);
}

export async function deleteJobAction(jobId) {
  await requireSession();

  await apiServerRequest(`/api/jobs/${jobId}`, {
    method: "DELETE",
  });

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${jobId}`);

  return successResult();
}
