import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { db } from "@/lib/db";
import { ChangeManagerForm } from "@/components/mess/change-manager-form";

export default async function ChangeManagerPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  if (!ctx.isManager) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Change Manager</h1>
        <p className="text-zinc-500">
          Only the current manager can assign or change the manager. Contact{" "}
          {ctx.mess.manager?.name ?? "the manager"}.
        </p>
      </div>
    );
  }

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
        Transfer management to another member. You will become a view-only member after
        transfer.
      </p>
      <ChangeManagerForm messId={ctx.messId} members={members} />
    </div>
  );
}
