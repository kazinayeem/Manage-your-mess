import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { getMyPendingBazaars } from "@/actions/bazaar";
import { BazaarTaskList } from "@/components/bazaar/bazaar-task-list";

export default async function MyBazaarPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  if (!ctx.member) notFound();

  const t = await getTranslations("bazaar");
  const tasks = await getMyPendingBazaars(messId, ctx.member.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("myBazaar")}</h1>
        <p className="text-sm text-zinc-500">{t("myBazaarDesc")}</p>
      </div>
      <BazaarTaskList messId={messId} tasks={tasks} />
    </div>
  );
}
