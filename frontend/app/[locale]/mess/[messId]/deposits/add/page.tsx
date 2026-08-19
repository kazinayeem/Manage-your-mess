import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireMessPage } from "@/lib/require-mess-page";
import { AddDepositForm } from "@/components/mess/add-deposit-form";

export default async function MessAddDepositPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canAddDeposits" });

  const members = await db.member.findMany({
    where: { messId: ctx.messId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Deposit</h1>
      <AddDepositForm messId={ctx.messId} members={members} />
    </div>
  );
}
