import { redirect } from "next/navigation";
import { requireSession } from "@/lib/server/auth";

export default async function LegacyWalletRedirectPage() {
  await requireSession();
  redirect("/wallet");
}
