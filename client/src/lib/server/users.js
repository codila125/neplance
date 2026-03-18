import { apiServerCall } from "@/lib/api/server";

export async function getFreelancersServer() {
  const data = await apiServerCall("/api/users/freelancers");
  return data?.data || [];
}

export async function getFreelancerByIdServer(id) {
  const data = await apiServerCall(`/api/users/freelancers/${id}`);
  return data?.data || null;
}

export async function getMyProfileServer() {
  const data = await apiServerCall("/api/users/me");
  return data?.data?.user || null;
}

export async function checkDeleteEligibilityServer() {
  return apiServerCall("/api/users/me/check-delete-eligibility");
}

export async function listUsersServer(searchParams = "") {
  const data = await apiServerCall(
    `/api/users${searchParams ? `?${searchParams}` : ""}`,
  );
  return data?.data || [];
}
