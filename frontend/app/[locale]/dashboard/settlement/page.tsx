import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { SettlementClient } from "@/components/mess/settlement-client";

export default async function SettlementPage() {
  const ctx = await getActiveMessContext();
  if (!ctx?.currentMonth) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monthly Settlement</h1>
      <SettlementClient messId={ctx.messId} monthId={ctx.currentMonth.id} />
    </div>
  );
}
