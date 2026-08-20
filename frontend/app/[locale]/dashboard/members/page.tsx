import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { apiGet } from "@/lib/api-client";
import { MembersTable } from "@/components/dashboard/members-table";

export default async function MembersPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  let members: any[] = [];
  if (ctx.currentMonth) {
    const res = await apiGet(`/reports/data?messId=${ctx.messId}&monthId=${ctx.currentMonth.id}`);
    const rows = res?.data?.rows || [];
    members = rows.map((m: any, idx: number) => ({
      id: m.id || String(idx),
      fullName: m.name,
      role: m.role || "MEMBER",
      status: m.status || "ACTIVE",
      totalMeals: m.mealCount || 0,
      totalDue: m.due || 0,
      totalDeposit: m.deposit || 0,
      user: { email: m.email || "" },
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>
      <MembersTable members={members} messId={ctx.messId} />
    </div>
  );
}
