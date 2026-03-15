import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_ROLE_COOKIE } from "@/lib/api/config";
import { apiServerCall } from "@/lib/api/server";
import { normalizeRoleList } from "@/shared/utils/auth";

const DASHBOARD_ROLE_REDIRECTS = {
  client: "/dashboard/freelancer/active-proposals",
  freelancer: "/dashboard/client/post-job",
};

async function resolveSession(user) {
  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  const roleList = normalizeRoleList(user.role);
  const activeRoleCookie = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value;
  const activeRole = roleList.includes(activeRoleCookie)
    ? activeRoleCookie
    : roleList[0] || "freelancer";

  return {
    user: {
      ...user,
      role: [activeRole, ...roleList.filter((role) => role !== activeRole)],
    },
    activeRole,
  };
}

export async function getCurrentUserServer() {
  const data = await apiServerCall("/api/auth/me");
  return data?.data?.user || null;
}

export async function getCurrentSessionServer() {
  const user = await getCurrentUserServer();
  return resolveSession(user);
}

export async function requireCurrentUser() {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireSession() {
  const user = await requireCurrentUser();
  return resolveSession(user);
}

export async function requireDashboardRole(role) {
  const session = await requireSession();

  if (session.activeRole !== role) {
    redirect(DASHBOARD_ROLE_REDIRECTS[role] || "/dashboard");
  }

  return session;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const user = await getCurrentUserServer();

  if (user) {
    redirect(destination);
  }

  return null;
}
