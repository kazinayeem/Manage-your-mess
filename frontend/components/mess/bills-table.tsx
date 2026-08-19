"use client";

import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import { messPath } from "@/lib/mess-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillCategoryType, BillStatus } from "@prisma/client";
import { Eye, Trash2 } from "lucide-react";
import { deleteBill } from "@/actions/bills";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

export type BillRow = {
  id: string;
  category: BillCategoryType;
  amount: number;
  billingMonth: Date;
  dueDate: Date | null;
  status: BillStatus;
  description: string | null;
  memberShares: { member: { fullName: string | null }; amount: number }[];
};

function statusVariant(status: BillStatus) {
  switch (status) {
    case "PAID":
      return "default" as const;
    case "OVERDUE":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export function BillsTable({
  messId,
  bills,
  readOnly = false,
}: {
  messId: string;
  bills: BillRow[];
  readOnly?: boolean;
}) {
  const router = useRouter();

  async function handleDelete(billId: string) {
    if (!confirm("Delete this bill? Member shares will be recalculated.")) return;
    const result = await deleteBill(messId, billId);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Delete failed");
      return;
    }
    toast.success("Bill deleted");
    router.refresh();
  }

  if (bills.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No bills recorded for this period.
      </p>
    );
  }

  return (
    <div className="table-scroll-x overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Category</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
            <th className="px-3 py-2 text-left font-medium">Month</th>
            <th className="px-3 py-2 text-left font-medium">Due</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Per Member</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => {
            const perMember =
              bill.memberShares.length > 0
                ? bill.memberShares.reduce((s, x) => s + x.amount, 0) / bill.memberShares.length
                : 0;
            return (
              <tr key={bill.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{getBillCategoryLabel(bill.category)}</p>
                  {bill.description && (
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{bill.description}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                  {formatCurrency(bill.amount)}
                </td>
                <td className="px-3 py-2.5">
                  {new Date(bill.billingMonth).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5">
                  {bill.dueDate
                    ? new Date(bill.dueDate).toLocaleDateString("en-GB")
                    : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={statusVariant(bill.status)}>{bill.status}</Badge>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                  ~{formatCurrency(perMember)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={messPath(messId, `/bills/${bill.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {!readOnly && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(bill.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
