import { EditProfilePageClient } from "@/features/profile/components/EditProfilePageClient";
import { requireSession } from "@/lib/server/auth";

export default async function EditProfilePage() {
  const { user } = await requireSession();

  return <EditProfilePageClient initialUser={user} />;
}
