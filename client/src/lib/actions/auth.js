"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/config";
import { loginSchema, signupSchema, validateForm } from "@/shared/validation";

const parseCookieValue = (value) => {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

const applyBackendCookies = async (response) => {
  const cookieStore = await cookies();
  const setCookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  for (const header of setCookieHeaders) {
    const [nameValue, ...attributeParts] = header.split(";");
    const separatorIndex = nameValue.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();
    const options = {};

    for (const part of attributeParts) {
      const [rawKey, rawValue] = part.trim().split("=");
      const key = rawKey.toLowerCase();

      if (key === "httponly") options.httpOnly = true;
      if (key === "secure") options.secure = true;
      if (key === "path") options.path = rawValue || "/";
      if (key === "samesite") {
        options.sameSite = rawValue?.toLowerCase() || "lax";
      }
      if (key === "max-age") options.maxAge = parseCookieValue(rawValue);
      if (key === "expires" && rawValue) options.expires = new Date(rawValue);
    }

    cookieStore.set(name, value, options);
  }
};

const buildSignupPayload = (formData) => {
  const parseCsv = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const roles = formData.getAll("roles").map(String);
  const isFreelancerSelected = roles.includes("freelancer");
  const location = {
    city: String(formData.get("city") || "").trim(),
    district: String(formData.get("district") || "").trim(),
    province: String(formData.get("province") || "").trim(),
  };
  const hasLocation = Object.values(location).some(Boolean);

  const submitData = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    passwordConfirm: String(formData.get("passwordConfirm") || ""),
    phone: String(formData.get("phone") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    city: location.city || undefined,
    district: location.district || undefined,
    province: location.province || undefined,
    skills: isFreelancerSelected
      ? parseCsv(String(formData.get("skills") || ""))
      : undefined,
    languages: isFreelancerSelected
      ? parseCsv(String(formData.get("languages") || ""))
      : undefined,
    hourlyRate: isFreelancerSelected
      ? String(formData.get("hourlyRate") || "0")
      : undefined,
    experienceLevel: isFreelancerSelected
      ? String(formData.get("experienceLevel") || "entry")
      : undefined,
    jobTypePreference: isFreelancerSelected
      ? String(formData.get("jobTypePreference") || "digital")
      : undefined,
    availabilityStatus: isFreelancerSelected
      ? String(formData.get("availabilityStatus") || "available")
      : undefined,
    roles,
  };

  const { errors, data } = validateForm(signupSchema, submitData);

  if (errors) {
    return { errors, payload: null };
  }

  return {
    errors: null,
    payload: {
      name: data.name,
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      phone: data.phone,
      bio: data.bio,
      location: hasLocation ? location : undefined,
      skills: isFreelancerSelected
        ? parseCsv(String(formData.get("skills") || ""))
        : undefined,
      languages: isFreelancerSelected
        ? parseCsv(String(formData.get("languages") || ""))
        : undefined,
      hourlyRate: isFreelancerSelected
        ? Number(String(formData.get("hourlyRate") || "0")) || 0
        : undefined,
      experienceLevel: isFreelancerSelected ? data.experienceLevel : undefined,
      jobTypePreference: isFreelancerSelected
        ? data.jobTypePreference
        : undefined,
      availabilityStatus: isFreelancerSelected
        ? data.availabilityStatus
        : undefined,
      role: data.roles,
    },
  };
};

const submitAuthRequest = async (endpoint, payload) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Authentication failed.");
  }

  await applyBackendCookies(response);
  return data;
};

export async function loginAction(formData) {
  const payload = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const { errors, data } = validateForm(loginSchema, payload);

  if (errors) {
    const message = Object.values(errors)[0] || "Please check your inputs.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  try {
    await submitAuthRequest("/api/auth/login", data);
    redirect("/dashboard");
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
}

export async function signupAction(formData) {
  const { errors, payload } = buildSignupPayload(formData);

  if (errors) {
    const message = Object.values(errors)[0] || "Please check your inputs.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  try {
    await submitAuthRequest("/api/auth/register", payload);
    redirect("/dashboard");
  } catch (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
}
