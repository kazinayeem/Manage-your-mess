import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessAwareHomeRoute } from "@/lib/route-guard";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect("/login");

  const home = await getMessAwareHomeRoute(session.user.id, session.user.role);
  if (home !== "/welcome") redirect(home);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
          MF
        </div>
        <h1 className="text-2xl font-bold">Welcome to MessFlow Pro</h1>
        <p className="text-zinc-500">
          Create your own mess and become owner, or join an existing mess as a member using an invite code.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/welcome/create">Create Mess</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/welcome/join">Join with Invite Code</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
