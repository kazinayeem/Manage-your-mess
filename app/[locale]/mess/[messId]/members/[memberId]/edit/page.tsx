import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { EditMemberForm } from "@/components/mess/member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ messId: string; memberId: string }>;
}) {
  const { messId, memberId } = await params;
  const t = await getTranslations("messMembers");
  const ctx = await requireMessPage(messId, { requireManager: true, requireWrite: true });

  const member = await db.member.findFirst({
    where: { id: memberId, messId: ctx.messId, deletedAt: null },
  });
  if (!member) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
      <EditMemberForm
        messId={ctx.messId}
        memberId={member.id}
        defaultValues={{
          fullName: member.fullName ?? "",
          phone: member.phone,
          nid: member.nid,
          bloodGroup: member.bloodGroup,
          address: member.address,
          occupation: member.occupation,
          university: member.university,
          monthlyDeposit: member.monthlyDeposit,
        }}
      />
    </div>
  );
}
