import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { CreateBazaarForm } from "@/components/bazaar/create-bazaar-form";

export default async function NewBazaarPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canManageBazaar" });
  if (!ctx.capabilities.canManageBazaar) notFound();

  const t = await getTranslations("bazaar");
  const members = await db.member.findMany({
    where: { messId: ctx.messId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("createTask")}</h1>
        <p className="text-sm text-zinc-500">{t("createTaskDesc")}</p>
      </div>
      <CreateBazaarForm messId={messId} members={members} defaultDate={today} />
    </div>
  );
}
