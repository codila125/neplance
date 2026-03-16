import { TalentPageClient } from "@/features/users/components/TalentPageClient";
import { requireCurrentUser } from "@/lib/server/auth";
import { getFreelancersServer } from "@/lib/server/users";

export default async function TalentPage() {
  const [user, freelancers] = await Promise.all([
    requireCurrentUser(),
    getFreelancersServer(),
  ]);

  return (
    <TalentPageClient initialFreelancers={freelancers} initialUser={user} />
  );
}
