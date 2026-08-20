import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { AddDepositForm } from "@/components/mess/add-deposit-form";

export default async function AddDepositPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  const res = await apiGet(`/messes/${ctx.messId}`);
  const members = (res?.data?.members || []).map((m: any) => ({
    id: m.id,
    fullName: m.fullName,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Deposit</h1>
      <AddDepositForm messId={ctx.messId} members={members} />
    </div>
  );
}
