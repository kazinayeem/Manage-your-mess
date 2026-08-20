import { requireMessPage } from "@/lib/require-mess-page";
import { apiGet } from "@/lib/api-client";
import { ChangeManagerForm } from "@/components/mess/change-manager-form";

export default async function MessChangeManagerPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canChangeManager" });

  const res = await apiGet(`/messes/${messId}`);
  const mess = res?.data;
  const members = (mess?.members || [])
    .filter((m: any) => m.userId !== mess.managerId)
    .map((m: any) => ({
      id: m.id,
      fullName: m.fullName,
      role: m.role,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Change Manager</h1>
      <p className="text-sm text-zinc-500">
        Transfer day-to-day management to another member. The previous manager (including the
        mess creator) will become a <strong>view-only</strong> member with no edit access.
      </p>
      <ChangeManagerForm messId={ctx.messId} members={members} />
    </div>
  );
}
