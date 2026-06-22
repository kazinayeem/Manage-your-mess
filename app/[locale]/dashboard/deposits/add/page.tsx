import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { db } from "@/lib/db";
import { AddDepositForm } from "@/components/mess/add-deposit-form";

export default async function AddDepositPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

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
