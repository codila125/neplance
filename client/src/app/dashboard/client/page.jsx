import { redirect } from "next/navigation";
import { requireDashboardRole } from "@/lib/server/auth";

export default async function ClientDashboardIndexPage() {
  await requireDashboardRole("client");
  redirect("/dashboard/client/my-jobs");
}
