import { redirect } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { SettlementClient } from "@/components/mess/settlement-client";
import { messPath } from "@/lib/mess-routes";

export default async function MessSettlementPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canGenerateReports" });
  if (!ctx.currentMonth) redirect(messPath(messId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monthly Settlement</h1>
      <SettlementClient messId={ctx.messId} monthId={ctx.currentMonth.id} />
    </div>
  );
}
