import { FreelancerProfilePageClient } from "@/features/users/components/FreelancerProfilePageClient";
import { requireCurrentUser } from "@/lib/server/auth";
import { getFreelancerByIdServer } from "@/lib/server/users";

export default async function FreelancerProfilePage({ params }) {
  const { id } = await params;
  const [user, freelancer] = await Promise.all([
    requireCurrentUser(),
    getFreelancerByIdServer(id),
  ]);

  return (
    <FreelancerProfilePageClient
      initialFreelancer={freelancer}
      initialUser={user}
    />
  );
}
