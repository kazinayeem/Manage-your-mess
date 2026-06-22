import { notFound } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { getBill } from "@/actions/bills";
import { formatCurrency } from "@/lib/utils";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BillPaymentForm } from "@/components/mess/bill-payment-form";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ messId: string; billId: string }>;
}) {
  const { messId, billId } = await params;
  const ctx = await requireMessPage(messId);
  const bill = await getBill(messId, billId);
  if (!bill) notFound();

  const canPay = !ctx.capabilities.readOnly && ctx.capabilities.canManageBills;
  const totalPaid = bill.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{getBillCategoryLabel(bill.category)}</h1>
          <p className="text-sm text-zinc-500">{bill.description ?? "No description"}</p>
        </div>
        <Badge>{bill.status}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Amount</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(bill.amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Paid / Remaining</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(totalPaid)} / {formatCurrency(Math.max(0, bill.amount - totalPaid))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Billing Month</span>
            <span>{new Date(bill.billingMonth).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Due Date</span>
            <span>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Split Method</span>
            <span>{bill.splitMethod.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Paid By</span>
            <span>{bill.paidBy?.fullName ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Member Shares</h2>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left">Member</th>
                <th className="px-3 py-2 text-right">Share</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {bill.memberShares.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{s.member.fullName ?? "Unnamed"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(s.amount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-600">
                    {formatCurrency(s.paidAmount)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-600">
                    {formatCurrency(Math.max(0, s.amount - s.paidAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canPay && (
        <BillPaymentForm
          messId={messId}
          billId={bill.id}
          members={bill.memberShares.map((s) => ({
            id: s.memberId,
            fullName: s.member.fullName,
          }))}
        />
      )}
    </div>
  );
}
