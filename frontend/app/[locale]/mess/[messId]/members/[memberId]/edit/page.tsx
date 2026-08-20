import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
import { EditMemberForm } from "@/components/mess/member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ messId: string; memberId: string }>;
}) {
  const { messId, memberId } = await params;
  const t = await getTranslations("messMembers");
  const ctx = await requireMessPage(messId, { requireManager: true, requireWrite: true });

  const res = await apiGet(`/messes/${messId}`);
  const mess = res?.data;
  if (!mess) notFound();

  const member = mess.members?.find((m: any) => m.id === memberId || m.userId === memberId);
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
          monthlyDeposit: member.monthlyDeposit || 0,
        }}
      />
    </div>
  );
}
