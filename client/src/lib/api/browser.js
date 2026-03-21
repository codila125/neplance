"use client";

import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/api/config";

const parseResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
};

const readCookie = (name) => {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) {
    return "";
  }

  return decodeURIComponent(match.slice(name.length + 1));
};

export const getBrowserAccessToken = () => readCookie(ACCESS_TOKEN_COOKIE);

export async function browserApiRequest(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  const accessToken = getBrowserAccessToken();

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const data = await parseResponseBody(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
