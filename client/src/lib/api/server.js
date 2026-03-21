import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/api/config";

const REQUEST_TIMEOUT_MS = 15000;

const parseJsonResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const buildRequestOptions = (options, headers) => {
  const requestOptions = {
    ...options,
    headers,
    cache: "no-store",
  };

  if (!requestOptions.signal && typeof AbortSignal?.timeout === "function") {
    requestOptions.signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }

  return requestOptions;
};

const toRequestError = (error) => {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    return new Error("The server took too long to respond. Please try again.");
  }

  return new Error(
    "We couldn't reach the server right now. Please try again in a moment.",
  );
};

export async function apiServerCall(endpoint, options = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      buildRequestOptions(options, headers),
    );
  } catch {
    return null;
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    return null;
  }

  return data;
}

export async function apiServerRequest(endpoint, options = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      buildRequestOptions(options, headers),
    );
  } catch (error) {
    throw toRequestError(error);
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}
