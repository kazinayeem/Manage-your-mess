import { requireMessPage } from "@/lib/require-mess-page";
import { AddMemberFormClient } from "@/components/mess/member-form";
import { getTranslations } from "next-intl/server";

export default async function MessAddMemberPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const t = await getTranslations("messMembers");
  await requireMessPage(messId, { requireManager: true, requireWrite: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("addTitle")}</h1>
      <AddMemberFormClient messId={messId} />
    </div>
  );
}
