import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { AddMealForm } from "@/components/mess/add-meal-form";

export default async function AddMealPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const res = await apiGet(`/messes/${ctx.messId}`);
  const members = (res?.data?.members || []).map((m: any) => ({
    id: m.id,
    fullName: m.fullName,
  }));

  const today = new Date().toISOString().split("T")[0];

  return <AddMealForm messId={ctx.messId} members={members} defaultDate={today} />;
}
