import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPortalMesses } from "@/lib/portal-queries";
import { MessCard } from "@/components/portal/mess-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PlusCircle, UserPlus } from "lucide-react";

export default async function PortalHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("portal");
  const messes = await getPortalMesses(session.user.id);
  const name = session.user.name ?? "there";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">{t("hello", { name })}</h1>
        <p className="mt-1 text-zinc-500">
          {messes.length === 0
            ? t("noMesses")
            : t("memberOf", { count: messes.length })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/portal/create-mess">
              <PlusCircle className="h-4 w-4" />
              {t("createNewMess")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portal/join-mess">
              <UserPlus className="h-4 w-4" />
              {t("joinExistingMess")}
            </Link>
          </Button>
        </div>
      </section>

      {messes.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t("myMessesTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {messes.map((mess) => (
              <MessCard key={mess.messId} mess={mess} />
            ))}
          </div>
        </section>
      )}

      {messes.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
