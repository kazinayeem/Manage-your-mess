import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { db } from "@/lib/db";
import { AddMealCostForm } from "@/components/mess/add-cost-form";

export default async function AddCostPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

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
