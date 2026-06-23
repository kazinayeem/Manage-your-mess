import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { MemberAnalyticsView } from "@/components/analytics/member-analytics-view";

export default async function PortalAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getUserMesses(session.user.id);
  if (memberships.length === 0) redirect("/portal");

  const messId = memberships[0].messId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === "bn" ? "অ্যানালিটিক্স সেন্টার" : "Analytics Center"}</h1>
        <p className="text-zinc-500">
          {locale === "bn" ? "আপনার ব্যক্তিগত মেস অন্তর্দৃষ্টি" : "Your personal mess insights"}
        </p>
      </div>
      <MemberAnalyticsView messId={messId} />
    </div>
  );
}
