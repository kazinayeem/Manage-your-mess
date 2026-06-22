import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
