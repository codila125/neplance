"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  ACTIVE_ROLE_COOKIE,
  API_BASE_URL,
} from "@/lib/api/config";
import { VERIFICATION_REDIRECT_PATH } from "@/lib/server/auth";
import { normalizeRoleList } from "@/shared/utils/auth";
import { loginSchema, signupSchema, validateForm } from "@/shared/validation";

const INITIAL_AUTH_ACTION_STATE = {
  message: "",
  errors: {},
  values: {},
};

const parseCookieValue = (value) => {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

const splitSetCookieHeader = (headerValue) =>
  headerValue
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map((part) => part.trim())
    .filter(Boolean);

const getSetCookieHeaders = (response) => {
  if (typeof response.headers.getSetCookie === "function") {
    const headers = response.headers.getSetCookie();
    if (headers.length) {
      return headers;
    }
  }

  const setCookieHeader = response.headers.get("set-cookie");
  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
};

const applyBackendCookies = async (response) => {
  const cookieStore = await cookies();
  const setCookieHeaders = getSetCookieHeaders(response);

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

const applyAppSessionCookies = async (responseData) => {
  const cookieStore = await cookies();
  const accessToken = responseData?.accessToken;
  const roles = normalizeRoleList(responseData?.data?.user?.role);

  if (accessToken) {
    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (roles.length) {
    cookieStore.set(ACTIVE_ROLE_COOKIE, roles[0], {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }
};

const buildSignupPayload = (formData) => {
  const roles = formData.getAll("roles").map(String);
  const isFreelancerSelected = roles.includes("freelancer");
  const selectedSkills = formData.getAll("skills").map(String).filter(Boolean);
  const selectedTags = formData.getAll("tags").map(String).filter(Boolean);
  const locality = String(formData.get("locality") || "").trim();
  const location = {
    city: locality,
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
    skills: isFreelancerSelected ? selectedSkills : undefined,
    languages: isFreelancerSelected
      ? formData.getAll("languages").map(String).filter(Boolean)
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
        ? Array.from(new Set([...selectedSkills, ...selectedTags]))
        : undefined,
      languages: isFreelancerSelected
        ? formData.getAll("languages").map(String).filter(Boolean)
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
  await applyAppSessionCookies(data);
  return data;
};

const getPostAuthRedirectPath = (user) => {
  const roles = Array.isArray(user?.role)
    ? user.role
    : [user?.role].filter(Boolean);
  return roles.includes("admin") ? "/admin" : "/dashboard";
};

export async function loginAction(_previousState, formData) {
  const payload = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const { errors, data } = validateForm(loginSchema, payload);

  if (errors) {
    return {
      message: "Please fix the highlighted fields.",
      errors,
      values: {
        email: payload.email,
      },
    };
  }

  try {
    const response = await submitAuthRequest("/api/auth/login", data);
    redirect(getPostAuthRedirectPath(response?.data?.user));
  } catch (error) {
    return {
      ...INITIAL_AUTH_ACTION_STATE,
      message: error.message || "Failed to log in.",
      values: {
        email: payload.email,
      },
    };
  }
}

export async function signupAction(_previousState, formData) {
  const { errors, payload } = buildSignupPayload(formData);
  const locality = String(formData.get("locality") || "");
  const values = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    bio: String(formData.get("bio") || ""),
    locality,
    city: locality,
    district: String(formData.get("district") || ""),
    province: String(formData.get("province") || ""),
    skills: formData.getAll("skills").map(String),
    tags: formData.getAll("tags").map(String),
    languages: formData.getAll("languages").map(String),
    hourlyRate: String(formData.get("hourlyRate") || "0"),
    experienceLevel: String(formData.get("experienceLevel") || "entry"),
    jobTypePreference: String(formData.get("jobTypePreference") || "digital"),
    availabilityStatus: String(
      formData.get("availabilityStatus") || "available",
    ),
    roles: formData.getAll("roles").map(String),
  };

  if (errors) {
    return {
      message: "Please fix the highlighted fields.",
      errors,
      values,
    };
  }

  try {
    await submitAuthRequest("/api/auth/register", payload);
    redirect(VERIFICATION_REDIRECT_PATH);
  } catch (error) {
    return {
      ...INITIAL_AUTH_ACTION_STATE,
      message: error.message || "Failed to sign up.",
      values,
    };
  }
}
