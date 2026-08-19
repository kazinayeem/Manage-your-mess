import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses, getDashboardStats } from "@/lib/queries";
import { DashboardStats } from "@/components/dashboard/stats";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const stats = await getDashboardStats(messes[0].messId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <DashboardStats stats={stats} />
    </div>
  );
}
