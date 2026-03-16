import { AuthLayoutShell } from "@/features/auth/components/AuthLayoutShell";
import { SignupPageForm } from "@/features/auth/components/SignupPageForm";
import { redirectIfAuthenticated } from "@/lib/server/auth";

export default async function SignupPage({ searchParams }) {
  await redirectIfAuthenticated();
  const params = await searchParams;

  return (
    <AuthLayoutShell
      title="Create your account"
      description="Join thousands of freelancers and clients"
    >
      <SignupPageForm error={params?.error} />
    </AuthLayoutShell>
  );
}
