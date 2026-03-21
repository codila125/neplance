"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiServerRequest } from "@/lib/api/server";
import { requireSession } from "@/lib/server/auth";
import { profileUpdateSchema, validateForm } from "@/shared/validation";

const INITIAL_PROFILE_ACTION_STATE = {
  message: "",
  errors: {},
};

const parseCsv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const sanitizeVerificationDocuments = (documents = []) =>
  (Array.isArray(documents) ? documents : [])
    .map((document) => ({
      name: document?.name?.trim() || undefined,
      url: document?.url?.trim() || "",
      publicId: document?.publicId?.trim() || undefined,
      resourceType: document?.resourceType?.trim() || undefined,
    }))
    .filter((document) => document.url);

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

export async function updateProfileAction(_previousState, formData) {
  const session = await requireSession();
  const payload = parsePayload(formData);

  if (!payload) {
    return {
      ...INITIAL_PROFILE_ACTION_STATE,
      message: "Invalid profile submission.",
    };
  }

  const location = {
    address: payload.address?.trim() || "",
    city: payload.city?.trim() || "",
    district: payload.district?.trim() || "",
    province: payload.province?.trim() || "",
  };

  const hasCoordinates = payload.lat !== "" || payload.lng !== "";
  let lat;
  let lng;

  if (hasCoordinates) {
    lat = payload.lat === "" ? undefined : Number(payload.lat);
    lng = payload.lng === "" ? undefined : Number(payload.lng);
  }

  const submitData = {
    name: payload.name?.trim() || "",
    phone: payload.phone?.trim() || null,
    avatar: payload.avatar?.trim() || null,
    bio: payload.bio?.trim() || "",
    address: location.address || undefined,
    city: location.city || undefined,
    district: location.district || undefined,
    province: location.province || undefined,
    lat,
    lng,
  };

  if (session.activeRole === "freelancer") {
    submitData.skills = payload.skills || "";
    submitData.hourlyRate = Number(payload.hourlyRate) || 0;
    submitData.experienceLevel = payload.experienceLevel;
    submitData.jobTypePreference = payload.jobTypePreference;
    submitData.availabilityStatus = payload.availabilityStatus;
    submitData.languages = payload.languages || "";
    submitData.physicalServicesOffered = payload.physicalServicesOffered || "";
    submitData.serviceAreas = payload.serviceAreas || "";
    submitData.onsiteAvailable = Boolean(payload.onsiteAvailable);
    submitData.hasOwnTools = Boolean(payload.hasOwnTools);
    submitData.licenseOrCertification =
      payload.licenseOrCertification?.trim() || "";
    submitData.tradeExperienceYears =
      Number(payload.tradeExperienceYears) || 0;
    submitData.portfolio = Array.isArray(payload.portfolio)
      ? payload.portfolio.map((item) => ({
          title: item.title?.trim() || undefined,
          description: item.description?.trim() || undefined,
          imageUrls: item.imageUrls || undefined,
          projectUrl: item.projectUrl?.trim() || undefined,
          skills: item.skills || undefined,
          completedAt: item.completedAt || undefined,
        }))
      : [];
  }

  submitData.verificationDocuments = sanitizeVerificationDocuments(
    payload.verificationDocuments,
  );

  const { errors, data } = validateForm(profileUpdateSchema, submitData);

  if (errors) {
    return {
      message: "Please fix the highlighted fields.",
      errors,
    };
  }

  const locationPayload = { ...location };

  if (hasCoordinates) {
    const coordinates = {};
    if (data.lat !== undefined) coordinates.lat = data.lat;
    if (data.lng !== undefined) coordinates.lng = data.lng;
    if (Object.keys(coordinates).length > 0) {
      locationPayload.coordinates = coordinates;
    }
  }

  const finalPayload = {
    name: data.name,
    phone: data.phone,
    avatar: data.avatar,
    bio: data.bio,
    location: locationPayload,
    verificationDocuments: data.verificationDocuments,
  };

  if (session.activeRole === "freelancer") {
    finalPayload.skills = parseCsv(payload.skills || "");
    finalPayload.hourlyRate = data.hourlyRate;
    finalPayload.experienceLevel = data.experienceLevel;
    finalPayload.jobTypePreference = data.jobTypePreference;
    finalPayload.availabilityStatus = data.availabilityStatus;
    finalPayload.languages = parseCsv(payload.languages || "");
    finalPayload.physicalServicesOffered = parseCsv(
      payload.physicalServicesOffered || "",
    );
    finalPayload.serviceAreas = parseCsv(payload.serviceAreas || "");
    finalPayload.onsiteAvailable = data.onsiteAvailable;
    finalPayload.hasOwnTools = data.hasOwnTools;
    finalPayload.licenseOrCertification = data.licenseOrCertification?.trim();
    finalPayload.tradeExperienceYears = data.tradeExperienceYears;
    finalPayload.portfolio = (payload.portfolio || []).map((item) => ({
      title: item.title?.trim(),
      description: item.description?.trim(),
      imageUrls: parseCsv(item.imageUrls || ""),
      projectUrl: item.projectUrl?.trim(),
      skills: parseCsv(item.skills || ""),
      completedAt: item.completedAt || undefined,
    }));
  }

  try {
    await apiServerRequest("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(finalPayload),
    });
  } catch (error) {
    return {
      ...INITIAL_PROFILE_ACTION_STATE,
      message: error.message || "Failed to update profile.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/dashboard");
  redirect("/profile");
}
