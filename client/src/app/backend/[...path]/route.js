import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api/config";

const FORWARDED_RESPONSE_HEADERS = new Set([
  "content-type",
  "cache-control",
  "pragma",
  "expires",
  "location",
]);

const buildBackendUrl = (pathSegments, searchParams) => {
  const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : "";
  const search = searchParams?.toString();

  return `${normalizedBaseUrl}/${normalizedPath}${search ? `?${search}` : ""}`;
};

const buildForwardHeaders = (request) => {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return headers;
};

const createProxyResponse = async (backendResponse) => {
  const body =
    backendResponse.status === 204 ? null : await backendResponse.arrayBuffer();
  const response = new NextResponse(body, {
    status: backendResponse.status,
  });

  backendResponse.headers.forEach((value, key) => {
    if (FORWARDED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      response.headers.set(key, value);
    }
  });

  if (typeof backendResponse.headers.getSetCookie === "function") {
    for (const cookieHeader of backendResponse.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookieHeader);
    }
  } else {
    const setCookieHeader = backendResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.append("set-cookie", setCookieHeader);
    }
  }

  return response;
};

const proxyRequest = async (request, context) => {
  const params = await context.params;
  const backendUrl = buildBackendUrl(
    params?.path,
    request.nextUrl.searchParams,
  );
  const method = request.method;
  const headers = buildForwardHeaders(request);
  const init = {
    method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await request.arrayBuffer();
  }

  let backendResponse;

  try {
    backendResponse = await fetch(backendUrl, init);
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Backend service is unavailable right now.",
      },
      { status: 502 },
    );
  }

  return createProxyResponse(backendResponse);
};

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function PUT(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request, context) {
  return proxyRequest(request, context);
}
