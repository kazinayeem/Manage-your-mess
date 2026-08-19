import { requireMessPage } from "@/lib/require-mess-page";
import { db } from "@/lib/db";
import { ChangeManagerForm } from "@/components/mess/change-manager-form";

export default async function MessChangeManagerPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canChangeManager" });

  const members = await db.member.findMany({
    where: {
      messId: ctx.messId,
      deletedAt: null,
      status: "ACTIVE",
      userId: { not: ctx.mess.managerId ?? "" },
    },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
  });

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
