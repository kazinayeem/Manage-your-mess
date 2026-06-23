import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBazaarTasks } from "@/actions/bazaar";
import { BazaarTaskList } from "@/components/bazaar/bazaar-task-list";
import { Button } from "@/components/ui/button";
import { messPath } from "@/lib/mess-routes";

export default async function BazaarListPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  const t = await getTranslations("bazaar");

  if (!ctx.capabilities.canManageBazaar && !ctx.capabilities.canViewMyBazaar) {
    notFound();
  }

  if (!ctx.capabilities.canManageBazaar) {
    redirect(messPath(messId, "/bazaar/my"));
  }

  const tasks = await getBazaarTasks(messId, "all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("bazaarList")}</h1>
          <p className="text-sm text-zinc-500">{t("bazaarListDesc")}</p>
        </div>
        <Button asChild>
          <Link href={messPath(messId, "/bazaar/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createTask")}
          </Link>
        </Button>
      </div>
      <BazaarTaskList messId={messId} tasks={tasks} />
    </div>
  );
}
