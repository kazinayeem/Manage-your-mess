import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { AddMemberForm } from "@/components/mess/add-member-form";

export default async function AddMemberPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Member</h1>
      <AddMemberForm messId={ctx.messId} />
    </div>
  );
}
