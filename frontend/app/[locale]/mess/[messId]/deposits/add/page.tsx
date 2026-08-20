import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
import { AddDepositForm } from "@/components/mess/add-deposit-form";

export default async function MessAddDepositPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddDeposits" });

  const res = await apiGet(`/messes/${messId}`);
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
