import { requireMessPage } from "@/lib/require-mess-page";
import { AddMealCostForm } from "@/components/mess/add-cost-form";
import { apiGet } from "@/lib/api-client";

export default async function MessAddExpensePage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddExpenses" });

  const res = await apiGet(`/messes/${messId}`);
  const members = (res?.data?.members || []).map((m: any) => ({
    id: m.id,
    fullName: m.fullName,
  }));

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <AddMealCostForm messId={ctx.messId} members={members} defaultDate={today} />
    </div>
  );
}
