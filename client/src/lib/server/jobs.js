import { apiServerCall } from "@/lib/api/server";

export async function listOpenJobsServer(searchParams = "") {
  const data = await apiServerCall(
    `/api/jobs${searchParams ? `?${searchParams}` : ""}`,
  );
  return data?.data || [];
}

export async function getMyJobsServer() {
  const data = await apiServerCall("/api/jobs/myJobs");
  return data?.data || [];
}

export async function getJobByIdServer(jobId) {
  const data = await apiServerCall(`/api/jobs/${jobId}`);
  return data?.data || null;
}

export async function listAllJobsServer(searchParams = "") {
  const data = await apiServerCall(
    `/api/admin/jobs${searchParams ? `?${searchParams}` : ""}`,
  );
  return data?.data || [];
}

export async function listSavedJobsServer() {
  const data = await apiServerCall("/api/users/me/saved-jobs");
  return data?.data || [];
}
