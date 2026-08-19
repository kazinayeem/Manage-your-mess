import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBazaarTasks } from "@/actions/bazaar";
import { BazaarTaskList } from "@/components/bazaar/bazaar-task-list";

export default async function AssignedBazaarPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canManageBazaar" });
  if (!ctx.capabilities.canManageBazaar) notFound();

  const t = await getTranslations("bazaar");
  const tasks = await getBazaarTasks(messId, "assigned");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("assignedBazaar")}</h1>
        <p className="text-sm text-zinc-500">{t("assignedBazaarDesc")}</p>
      </div>
      <BazaarTaskList messId={messId} tasks={tasks} />
    </div>
  );
}
