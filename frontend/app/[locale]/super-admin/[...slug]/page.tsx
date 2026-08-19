import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KNOWN_SECTIONS = new Set([
  "users",
  "messes",
  "subscriptions",
  "payments",
  "payment-methods",
  "plans",
  "coupons",
  "referrals",
  "support",
  "announcements",
  "analytics",
  "audit-logs",
  "settings",
  "database",
  "feature-flags",
  "backups",
  "api",
  "email-templates",
  "notification-templates",
  "security",
  "profile",
]);

export default async function SuperAdminCatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const first = slug[0] ?? "";
  const known = KNOWN_SECTIONS.has(first);

  const title = locale === "bn" ? "পেজটি এখনো প্রস্তুত নয়" : "This page is not ready yet";
  const description = known
    ? locale === "bn"
      ? "এই সুপার অ্যাডমিন সেকশনের গভীরতর সাবপেজ এখনো তৈরি করা হয়নি। আপাতত মূল সেকশন থেকে কাজ চালিয়ে যান।"
      : "This deeper super admin subpage is not implemented yet. Please continue from the main section for now."
    : locale === "bn"
      ? "এই রুটের জন্য কোনো সুপার অ্যাডমিন পেজ পাওয়া যায়নি।"
      : "No super admin page was found for this route.";

  const target = known ? `/super-admin/${first}` : "/super-admin";
  const buttonLabel = known
    ? locale === "bn"
      ? "মূল সেকশনে ফিরে যান"
      : "Go to section"
    : locale === "bn"
      ? "ড্যাশবোর্ডে ফিরে যান"
      : "Go to dashboard";

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl rounded-2xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-500">{description}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={target}>{buttonLabel}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/super-admin">{locale === "bn" ? "সুপার অ্যাডমিন হোম" : "Super Admin Home"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
