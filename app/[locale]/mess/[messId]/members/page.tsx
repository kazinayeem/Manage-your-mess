import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { getMonthSummary } from "@/actions/monthly";
import { MembersTable } from "@/components/dashboard/members-table";
import { PendingMembersPanel } from "@/components/mess/pending-members-panel";
import { db } from "@/lib/db";
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

  const allMembers = await db.member.findMany({
    where: {
      messId: ctx.messId,
      deletedAt: null,
      status: { in: ["ACTIVE", "PENDING"] },
    },
    include: { user: { select: { email: true } } },
    orderBy: [{ status: "asc" }, { fullName: "asc" }],
  });

  const summary = ctx.currentMonth
    ? await getMonthSummary(ctx.messId, ctx.currentMonth.id)
    : null;

  const members = allMembers.map((m) => {
    const stats = summary?.members.find((s) => s.id === m.id);
    return {
      id: m.id,
      fullName: m.fullName,
      role: m.role,
      status: m.status,
      totalMeals: stats?.mealCount ?? 0,
      totalDue: stats?.due ?? 0,
      totalDeposit: stats?.totalDeposit ?? 0,
      user: { email: m.user.email },
    };
  });

  const pending = allMembers
    .filter((m) => m.status === "PENDING")
    .map((m) => ({
      id: m.id,
      fullName: m.fullName,
      email: m.user.email,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {ctx.isManager && (
          <Button asChild className="gap-2">
            <Link href={messPath(ctx.messId, "/members/add")}>
              <UserPlus className="h-4 w-4" />
              {t("addMember")}
            </Link>
          </Button>
        )}
      </div>

      {ctx.isManager && pending.length > 0 && (
        <PendingMembersPanel messId={ctx.messId} members={pending} />
      )}

      <MembersTable members={members} messId={ctx.messId} isManager={ctx.isManager} />
    </div>
  );
}
