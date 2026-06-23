import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { MemberAnalyticsView } from "@/components/analytics/member-analytics-view";

export default async function MemberAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getUserMesses(session.user.id);
  if (memberships.length === 0) redirect("/portal");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Analytics</h1>
        <p className="text-zinc-500">Personal meal, deposit, and balance trends</p>
      </div>
      <MemberAnalyticsView messId={memberships[0].messId} />
    </div>
  );
}
