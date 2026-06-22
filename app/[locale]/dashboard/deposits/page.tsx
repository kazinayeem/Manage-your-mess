import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses, getMessDeposits } from "@/lib/queries";
import { DepositsTable } from "@/components/dashboard/deposits-table";

export default async function DepositsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const deposits = await getMessDeposits(messes[0].messId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deposits</h1>
      <DepositsTable deposits={deposits} messId={messes[0].messId} />
    </div>
  );
}
