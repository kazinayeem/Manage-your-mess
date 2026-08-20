import { requireMessPage } from "@/lib/require-mess-page";
import { AddMealForm } from "@/components/mess/add-meal-form";
import { apiGet } from "@/lib/api-client";

export default async function MessAddMealPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddMeals" });

  const res = await apiGet(`/messes/${messId}`);
  const members = (res?.data?.members || []).map((m: any) => ({
    id: m.id,
    fullName: m.fullName,
  }));

  const today = new Date().toISOString().split("T")[0];

  return (
    <AddMealForm messId={ctx.messId} members={members} defaultDate={today} />
  );
}
