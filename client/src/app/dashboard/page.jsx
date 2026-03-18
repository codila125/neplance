import { redirect } from "next/navigation";
import { requireSession } from "@/lib/server/auth";

export default async function DashboardPage() {
  const { activeRole } = await requireSession();

  redirect(
    activeRole === "client"
      ? "/dashboard/client/my-contracts"
      : "/dashboard/freelancer/my-contracts",
  );
}
