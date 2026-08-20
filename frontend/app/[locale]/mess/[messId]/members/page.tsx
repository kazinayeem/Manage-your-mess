import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
import { MembersTable } from "@/components/dashboard/members-table";
import { PendingMembersPanel } from "@/components/mess/pending-members-panel";
import { messPath } from "@/lib/mess-routes";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default async function MessMembersPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const t = await getTranslations("messMembers");
  const ctx = await requireMessPage(messId, {
    capability: "canViewMembers",
  });

  let members: any[] = [];
  const pending: any[] = [];

  if (ctx.currentMonth) {
    const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${ctx.currentMonth.id}`);
    const rows = res?.data?.rows || [];
    members = rows.map((m: any, idx: number) => ({
      id: m.id || String(idx),
      fullName: m.name,
      role: m.role || "MEMBER",
      status: m.status || "ACTIVE",
      totalMeals: m.mealCount || 0,
      totalDue: m.due || 0,
      totalDeposit: m.deposit || 0,
      user: { email: m.email || "" },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {ctx.capabilities.canManageMembers && (
          <Button asChild className="gap-2">
            <Link href={messPath(ctx.messId, "/members/add")}>
              <UserPlus className="h-4 w-4" />
              {t("addMember")}
            </Link>
          </Button>
        )}
      </div>

      {ctx.capabilities.canManageMembers && pending.length > 0 && (
        <PendingMembersPanel messId={ctx.messId} members={pending} />
      )}

      <MembersTable
        members={members}
        messId={ctx.messId}
        canManage={ctx.capabilities.canManageMembers}
      />
    </div>
  );
}
