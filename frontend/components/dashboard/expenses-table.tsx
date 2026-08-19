"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveExpense } from "@/actions/mess";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Expense = {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  date: Date;
  category: { name: string };
  createdBy: { name: string | null };
};

export function ExpensesTable({ expenses, messId }: { expenses: Expense[]; messId: string }) {
  const columns: ColumnDef<Expense>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: "category.name", header: "Category", cell: ({ row }) => row.original.category.name },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "APPROVED" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.status === "PENDING" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const r = await approveExpense(messId, row.original.id);
              if (r.success) toast.success("Expense approved");
              else toast.error(r.error);
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ];

  return <DataTable columns={columns} data={expenses} />;
}
