import { AuthLayoutShell } from "@/features/auth/components/AuthLayoutShell";
import { LoginPageForm } from "@/features/auth/components/LoginPageForm";
import { redirectIfAuthenticated } from "@/lib/server/auth";

export default async function LoginPage({ searchParams }) {
  await redirectIfAuthenticated();
  const params = await searchParams;

  return (
    <AuthLayoutShell
      title="Welcome back"
      description="Sign in to continue to Neplance"
    >
      <LoginPageForm error={params?.error} />
    </AuthLayoutShell>
  );
}
