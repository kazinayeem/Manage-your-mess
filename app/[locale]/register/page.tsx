import { setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthPageShell>
      <RegisterForm />
    </AuthPageShell>
  );
}
