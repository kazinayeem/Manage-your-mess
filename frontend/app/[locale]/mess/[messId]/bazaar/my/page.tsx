import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
import { BazaarTaskList } from "@/components/bazaar/bazaar-task-list";

export default async function MyBazaarPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  if (!ctx.capabilities.canViewMyBazaar) notFound();
  if (!ctx.member) notFound();

  const t = await getTranslations("bazaar");
  const res = await apiGet(`/bazaar/my?messId=${messId}`);
  const tasks = res?.data || res || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("myBazaar")}</h1>
        <p className="text-sm text-zinc-500">{t("myBazaarDesc")}</p>
      </div>
      <BazaarTaskList messId={messId} tasks={Array.isArray(tasks) ? tasks : []} />
    </div>
  );
}
