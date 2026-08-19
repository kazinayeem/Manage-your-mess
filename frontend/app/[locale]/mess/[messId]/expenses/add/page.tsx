import { requireMessPage } from "@/lib/require-mess-page";
import { AddMealCostForm } from "@/components/mess/add-cost-form";
import { db } from "@/lib/db";

export default async function MessAddExpensePage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddExpenses" });

  const members = await db.member.findMany({
    where: { messId: ctx.messId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <AddMealCostForm messId={ctx.messId} members={members} defaultDate={today} />
    </div>
  );
}
