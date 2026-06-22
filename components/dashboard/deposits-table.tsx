"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveDeposit } from "@/actions/mess";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Deposit = {
  id: string;
  amount: number;
  method: string;
  type: string;
  status: string;
  createdAt: Date;
  member: { fullName: string | null };
};

export function DepositsTable({ deposits, messId }: { deposits: Deposit[]; messId: string }) {
  const columns: ColumnDef<Deposit>[] = [
    { accessorKey: "createdAt", header: "Date", cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: "member.fullName", header: "Member", cell: ({ row }) => row.original.member.fullName ?? "—" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
    { accessorKey: "method", header: "Method" },
    { accessorKey: "type", header: "Type" },
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
            onClick={async () => {
              const r = await approveDeposit(messId, row.original.id);
              if (r.success) toast.success("Deposit approved");
              else toast.error(r.error);
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ];

  return <DataTable columns={columns} data={deposits} />;
}
