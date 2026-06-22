import { requireMessPage } from "@/lib/require-mess-page";
import { AddMealForm } from "@/components/mess/add-meal-form";
import { db } from "@/lib/db";

export default async function MessAddMealPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddMeals" });

  const members = await db.member.findMany({
    where: { messId: ctx.messId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true },
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <AddMealForm messId={ctx.messId} members={members} defaultDate={today} />
  );
}
