import { NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/admin",
  "/dashboard",
  "/jobs",
  "/profile",
  "/proposals",
  "/talent",
  "/freelancers",
];

const AUTH_PAGES = ["/login", "/signup"];

const isProtectedPath = (pathname) =>
  PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const isAuthPage = (pathname) => AUTH_PAGES.includes(pathname);

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("neplanceAccessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasSessionCookie = Boolean(accessToken || refreshToken);

  if (isProtectedPath(pathname) && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isAuthPage(pathname) && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/jobs/:path*",
    "/profile/:path*",
    "/proposals/:path*",
    "/talent/:path*",
    "/freelancers/:path*",
    "/login",
    "/signup",
  ],
};
