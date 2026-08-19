import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { getMonthSummary } from "@/actions/monthly";
import { formatCurrency, formatDate } from "@/lib/utils";
import { messPath } from "@/lib/mess-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ messId: string; memberId: string }>;
}) {
  const { messId, memberId } = await params;
  const t = await getTranslations("messMembers");
  const ctx = await requireMessPage(messId, { requireManager: true });

  const member = await db.member.findFirst({
    where: { id: memberId, messId: ctx.messId, deletedAt: null },
    include: { user: { select: { email: true } } },
  });
  if (!member) notFound();

  const summary = ctx.currentMonth
    ? await getMonthSummary(ctx.messId, ctx.currentMonth.id)
    : null;
  const stats = summary?.members.find((s) => s.id === member.id);

  const fields = [
    { label: t("fullName"), value: member.fullName ?? "—" },
    { label: t("email"), value: member.user.email },
    { label: t("phone"), value: member.phone ?? "—" },
    { label: t("nid"), value: member.nid ?? "—" },
    { label: t("bloodGroup"), value: member.bloodGroup ?? "—" },
    { label: t("address"), value: member.address ?? "—" },
    { label: t("occupation"), value: member.occupation ?? "—" },
    { label: t("university"), value: member.university ?? "—" },
    { label: t("role"), value: member.role },
    { label: t("status"), value: member.status },
    { label: t("joiningDate"), value: formatDate(member.joiningDate) },
    { label: t("monthlyDeposit"), value: formatCurrency(member.monthlyDeposit) },
    { label: t("meals"), value: String(stats?.mealCount ?? member.totalMeals) },
    { label: t("due"), value: formatCurrency(stats?.due ?? member.totalDue) },
    { label: t("deposit"), value: formatCurrency(stats?.totalDeposit ?? member.totalDeposit) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{member.fullName ?? t("unnamed")}</h1>
          <p className="text-sm text-zinc-500">{member.user.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={member.status === "ACTIVE" ? "success" : "secondary"}>{member.status}</Badge>
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link href={messPath(messId, `/members/${memberId}/edit`)}>
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{f.label}</p>
              <p className="mt-0.5 text-sm font-medium break-words">{f.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="ghost" asChild>
        <Link href={messPath(messId, "/members")}>{t("backToList")}</Link>
      </Button>
    </div>
  );
}
