"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";
import { getProposalByIdServer } from "@/lib/server/proposals";
import { proposalSchema, validateForm } from "@/shared/validation";

const parseCsvUrls = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildProposalPayload = (payload) => {
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : parseCsvUrls(payload.attachments || "");

  return {
    job: payload.job,
    amount: Number(payload.amount),
    coverLetter: String(payload.coverLetter || "").trim(),
    deliveryDays: Number(payload.deliveryDays),
    revisionsIncluded: Number(payload.revisionsIncluded) || 0,
    attachments,
  };
};

export async function submitProposalAction(_previousState, formData) {
  await requireSession();

  let payload;
  try {
    payload = JSON.parse(String(formData.get("payload") || "{}"));
  } catch {
    return {
      message: "Invalid proposal submission.",
      errors: {},
    };
  }

  const submitData = buildProposalPayload(payload);
  const { errors, data } = validateForm(proposalSchema, submitData);

  if (errors) {
    return {
      message: "Please fix the highlighted fields.",
      errors,
    };
  }

  try {
    await apiServerRequest("/api/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      message: error.message || "Failed to submit proposal.",
      errors: {},
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${submitData.job}`);
  redirect("/dashboard");
}

export async function createProposalMutationAction(payload) {
  await requireSession();

  const submitData = buildProposalPayload(payload);
  const { errors, data } = validateForm(proposalSchema, submitData);

  if (errors) {
    throw new Error(Object.values(errors)[0] || "Invalid proposal submission.");
  }

  const response = await apiServerRequest("/api/proposals", {
    method: "POST",
    body: JSON.stringify(data),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${submitData.job}`);

  return successResult(response?.data || response);
}

export async function resubmitProposalAction(_previousState, formData) {
  await requireSession();

  let payload;
  try {
    payload = JSON.parse(String(formData.get("payload") || "{}"));
  } catch {
    return {
      message: "Invalid proposal submission.",
      errors: {},
    };
  }

  const submitData = buildProposalPayload(payload);
  const { errors, data } = validateForm(proposalSchema, submitData);

  if (errors) {
    return {
      message: "Please fix the highlighted fields.",
      errors,
    };
  }

  try {
    const response = await apiServerRequest("/api/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const newId = response?.data?._id;

    revalidatePath("/dashboard");
    revalidatePath(`/jobs/${submitData.job}`);

    redirect(newId ? `/proposals/${newId}` : "/dashboard");
  } catch (error) {
    return {
      message: error.message || "Failed to resubmit proposal.",
      errors: {},
    };
  }
}

export async function rejectProposalAction(proposalId, reason) {
  await requireSession();

  await apiServerRequest(`/api/proposals/${proposalId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });

  const proposal = await getProposalByIdServer(proposalId);
  const jobId = proposal?.job?._id || proposal?.job;

  revalidatePath("/dashboard");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
  }
  revalidatePath(`/proposals/${proposalId}`);

  return successResult(proposal);
}

export async function withdrawProposalAction(proposalId) {
  await requireSession();

  await apiServerRequest(`/api/proposals/${proposalId}/withdraw`, {
    method: "PATCH",
  });

  const proposal = await getProposalByIdServer(proposalId);
  const jobId = proposal?.job?._id || proposal?.job;

  revalidatePath("/dashboard");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
  }
  revalidatePath(`/proposals/${proposalId}`);

  return successResult(proposal);
}
