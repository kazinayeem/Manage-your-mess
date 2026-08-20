import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
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

  const res = await apiGet(`/messes/${ctx.messId}`);
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
        Transfer management to another member. You will become a view-only member after
        transfer.
      </p>
      <ChangeManagerForm messId={ctx.messId} members={members} />
    </div>
  );
}
