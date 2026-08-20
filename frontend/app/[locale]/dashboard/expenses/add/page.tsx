import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { AddMealCostForm } from "@/components/mess/add-cost-form";

export default async function AddCostPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const res = await apiGet(`/messes/${ctx.messId}`);
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
