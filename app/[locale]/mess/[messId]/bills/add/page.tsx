import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { AddBillForm } from "@/components/mess/add-bill-form";
import { getTranslations } from "next-intl/server";

export default async function AddBillPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  const t = await getTranslations("messBills");

  if (!ctx.capabilities.canManageBills) notFound();

  const members = await db.member.findMany({
    where: { messId, deletedAt: null, status: "ACTIVE" },
    include: { bed: { include: { room: true } } },
    orderBy: { fullName: "asc" },
  });

  const defaultBillingMonth = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("addBill")}</h1>
        <p className="text-sm text-zinc-500">{t("addBillSubtitle")}</p>
      </div>
      <AddBillForm
        messId={messId}
        defaultBillingMonth={defaultBillingMonth}
        members={members.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          roomNumber: m.bed?.room?.number ?? null,
        }))}
      />
    </div>
  );
}
