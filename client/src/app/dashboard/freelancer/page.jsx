import { redirect } from "next/navigation";
import { requireDashboardRole } from "@/lib/server/auth";

export default async function FreelancerDashboardIndexPage() {
  await requireDashboardRole("freelancer");
  redirect("/dashboard/freelancer/my-contracts");
}
