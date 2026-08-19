import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { db } from "@/lib/db";
import { AddMealForm } from "@/components/mess/add-meal-form";

export default async function AddMealPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const members = await db.member.findMany({
    where: { messId: ctx.messId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true },
  });

  const today = new Date().toISOString().split("T")[0];

  return <AddMealForm messId={ctx.messId} members={members} defaultDate={today} />;
}
