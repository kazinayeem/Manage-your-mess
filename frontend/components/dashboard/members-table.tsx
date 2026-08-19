"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveMember, deleteMember } from "@/actions/mess";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { Eye, Pencil, Trash2 } from "lucide-react";

type Member = {
  id: string;
  fullName: string | null;
  role: string;
  status: string;
  totalMeals: number;
  totalDue: number;
  totalDeposit: number;
  user: { email: string };
};

export function MembersTable({
  members,
  messId,
  canManage = false,
}: {
  members: Member[];
  messId: string;
  canManage?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("messMembers");

  async function handleDelete(member: Member) {
    const name = member.fullName ?? member.user.email;
    if (!window.confirm(t("deleteConfirm", { name }))) return;

    const result = await deleteMember(messId, member.id);
    if (result.success) {
      toast.success(t("deleteSuccess"));
      router.refresh();
    } else {
      toast.error("error" in result ? result.error : t("deleteFailed"));
    }
  }

  const columns: ColumnDef<Member>[] = [
    { accessorKey: "fullName", header: t("name"), cell: ({ row }) => row.original.fullName ?? "—" },
    { accessorKey: "user.email", header: t("email"), cell: ({ row }) => row.original.user.email },
    { accessorKey: "role", header: t("role") },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "totalMeals", header: t("meals") },
    {
      accessorKey: "totalDue",
      header: t("due"),
      cell: ({ row }) => formatCurrency(row.original.totalDue),
    },
    {
      accessorKey: "totalDeposit",
      header: t("deposit"),
      cell: ({ row }) => formatCurrency(row.original.totalDeposit),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: t("actions"),
            cell: ({ row }: { row: { original: Member } }) => {
              const member = row.original;
              if (member.status === "PENDING") {
                return (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const r = await approveMember(messId, member.id);
                      if (r.success) {
                        toast.success(t("approveSuccess"));
                        router.refresh();
                      } else toast.error(r.error);
                    }}
                  >
                    {t("approve")}
                  </Button>
                );
              }
              return (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link href={messPath(messId, `/members/${member.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                      {t("view")}
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link href={messPath(messId, `/members/${member.id}/edit`)}>
                      <Pencil className="h-3.5 w-3.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  {member.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleDelete(member)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("delete")}
                    </Button>
                  )}
                </div>
              );
            },
          } as ColumnDef<Member>,
        ]
      : []),
  ];

  return <DataTable columns={columns} data={members} />;
}
