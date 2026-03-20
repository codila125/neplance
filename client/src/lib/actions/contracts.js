"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { successResult } from "@/lib/actions/result";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession, requireVerifiedSession } from "@/lib/server/auth";
import {
  contractCreateSchema,
  reviewCreateSchema,
  validateForm,
} from "@/shared/validation";

const parsePayload = (formData) => {
  try {
    return JSON.parse(String(formData.get("payload") || "{}"));
  } catch {
    return null;
  }
};

const isRedirectSignal = (error) =>
  typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT");

export async function createContractAction(_previousState, formData) {
  await requireVerifiedSession();
  const payload = parsePayload(formData);

  if (!payload) {
    return { message: "Invalid contract payload.", errors: {} };
  }

  const { errors, data } = validateForm(contractCreateSchema, {
    ...payload,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    milestones: Array.isArray(payload.milestones)
      ? payload.milestones.map((milestone) => ({
          ...milestone,
          value: Number(milestone.value) || 0,
        }))
      : [],
  });

  if (errors) {
    return { message: "Please fix the highlighted fields.", errors };
  }

  try {
    const response = await apiServerRequest(
      `/api/contracts/proposal/${data.proposalId}`,
      {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          terms: data.terms,
          contractType: data.contractType,
          totalAmount: data.totalAmount,
          milestones: data.milestones,
        }),
      },
    );

    const contractId = response?.data?._id;
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/client/wallet");
    revalidatePath("/dashboard/freelancer/earnings");
    revalidatePath("/messages");
    revalidatePath(`/proposals/${data.proposalId}`);

    redirect(contractId ? `/contracts/${contractId}` : "/dashboard");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    return {
      message: error.message || "Failed to create contract.",
      errors: {},
    };
  }
}

export async function updateContractAction(
  contractId,
  _previousState,
  formData,
) {
  await requireSession();
  const payload = parsePayload(formData);

  if (!payload) {
    return { message: "Invalid contract payload.", errors: {} };
  }

  const { errors, data } = validateForm(contractCreateSchema, {
    ...payload,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    milestones: Array.isArray(payload.milestones)
      ? payload.milestones.map((milestone) => ({
          ...milestone,
          value: Number(milestone.value) || 0,
        }))
      : [],
  });

  if (errors) {
    return { message: "Please fix the highlighted fields.", errors };
  }

  try {
    await apiServerRequest(`/api/contracts/${contractId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        terms: data.terms,
        contractType: data.contractType,
        totalAmount: data.totalAmount,
        milestones: data.milestones,
      }),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/client/wallet");
    revalidatePath(`/contracts/${contractId}`);
    redirect(`/contracts/${contractId}`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    return {
      message: error.message || "Failed to update contract.",
      errors: {},
    };
  }
}

export async function signContractAction(contractId) {
  await requireVerifiedSession();

  const response = await apiServerRequest(`/api/contracts/${contractId}/sign`, {
    method: "PATCH",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function rejectPendingContractAction(contractId, reason) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({
        reason: typeof reason === "string" ? reason.trim() : "",
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function cancelPendingContractAction(contractId) {
  await requireSession();

  const response = await apiServerRequest(`/api/contracts/${contractId}`, {
    method: "DELETE",
  });
  const proposalId = response?.data?.proposalId;
  const jobId = response?.data?.jobId;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/client/proposals");
  revalidatePath("/dashboard/freelancer/active-proposals");
  revalidatePath("/proposals");
  revalidatePath("/jobs");
  if (proposalId) {
    revalidatePath(`/proposals/${proposalId}`);
  }
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
  }
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function submitContractMilestoneAction(
  contractId,
  milestoneIndex,
  evidence,
  evidenceAttachments = [],
) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/milestones/${milestoneIndex}/submit`,
    {
      method: "PATCH",
      body: JSON.stringify({
        evidence: typeof evidence === "string" ? evidence.trim() : "",
        evidenceAttachments: Array.isArray(evidenceAttachments)
          ? evidenceAttachments.filter((attachment) => attachment?.url)
          : [],
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function approveContractMilestoneAction(
  contractId,
  milestoneIndex,
) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/milestones/${milestoneIndex}/approve`,
    {
      method: "PATCH",
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function requestContractMilestoneChangesAction(
  contractId,
  milestoneIndex,
  notes,
) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/milestones/${milestoneIndex}/request-changes`,
    {
      method: "PATCH",
      body: JSON.stringify({
        notes: typeof notes === "string" ? notes.trim() : "",
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function submitContractWorkAction(
  contractId,
  notes,
  attachments = [],
) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/submit`,
    {
      method: "PATCH",
      body: JSON.stringify({
        notes: typeof notes === "string" ? notes.trim() : "",
        attachments: Array.isArray(attachments)
          ? attachments.filter((attachment) => attachment?.url)
          : [],
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function requestContractDeliveryChangesAction(contractId, notes) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/submit/request-changes`,
    {
      method: "PATCH",
      body: JSON.stringify({
        notes: typeof notes === "string" ? notes.trim() : "",
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function completeContractAction(contractId) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/complete`,
    {
      method: "PATCH",
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function requestContractCancellationAction(contractId, reason) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify({
        reason: typeof reason === "string" ? reason.trim() : "",
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function respondContractCancellationAction(contractId, action) {
  await requireSession();

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/cancel/respond`,
    {
      method: "PATCH",
      body: JSON.stringify({ action }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/messages");

  return successResult(response?.data || response);
}

export async function submitContractReviewAction(contractId, payload) {
  await requireSession();

  const { errors, data } = validateForm(reviewCreateSchema, {
    rating: Number(payload.rating),
    comment: typeof payload.comment === "string" ? payload.comment.trim() : "",
  });

  if (errors) {
    throw new Error(Object.values(errors)[0] || "Invalid review.");
  }

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath(`/contracts/${contractId}`);

  return successResult(response?.data || response);
}

export async function createContractDisputeAction(contractId, payload) {
  await requireSession();

  const reason =
    typeof payload.reason === "string" ? payload.reason.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const evidenceAttachments = Array.isArray(payload.evidenceAttachments)
    ? payload.evidenceAttachments.filter((attachment) => attachment?.url)
    : [];

  if (!reason) {
    throw new Error("Please provide a dispute reason.");
  }

  const response = await apiServerRequest(
    `/api/contracts/${contractId}/disputes`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
        description,
        evidenceAttachments,
      }),
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/client/wallet");
  revalidatePath("/dashboard/freelancer/earnings");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/admin/disputes");
  revalidatePath("/notifications");

  return successResult(response?.data || response);
}
