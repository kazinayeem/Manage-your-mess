import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { getMessDeposits } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MessMemberDepositsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  await ensureCurrentMonth(ctx.messId);
  const allDeposits = await getMessDeposits(ctx.messId);
  const myDeposits = allDeposits.filter((d) => d.memberId === ctx.member.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Deposits</h1>
      <Card>
        <CardHeader>
          <CardTitle>Deposit history</CardTitle>
        </CardHeader>
        <CardContent>
          {myDeposits.length === 0 ? (
            <p className="text-sm text-zinc-500">No deposits recorded yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {myDeposits.map((d) => (
                <li key={d.id} className="flex justify-between py-2">
                  <span>{d.createdAt.toLocaleDateString()}</span>
                  <span>
                    {formatCurrency(d.amount)} · {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
