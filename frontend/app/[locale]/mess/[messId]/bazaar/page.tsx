import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireMessPage } from "@/lib/require-mess-page";
import { canViewBazaarAdmin } from "@/lib/bazaar-access";
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

  const canAdmin = canViewBazaarAdmin(ctx.capabilities, ctx.isOwner);

  if (!canAdmin && !ctx.capabilities.canViewMyBazaar) {
    notFound();
  }

  if (!canAdmin && ctx.capabilities.canViewMyBazaar) {
    redirect(messPath(messId, "/bazaar/my"));
  }

  const tasks = await getBazaarTasks(messId, "all");
  const canManage = ctx.capabilities.canManageBazaar;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("bazaarList")}</h1>
          <p className="text-sm text-zinc-500">{t("bazaarListDesc")}</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={messPath(messId, "/bazaar/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createTask")}
            </Link>
          </Button>
        )}
      </div>
      <BazaarTaskList messId={messId} tasks={tasks} />
    </div>
  );
}
