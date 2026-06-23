import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessSuperAdmin } from "@/lib/route-guard";
import { getUserSubscriptionAccess } from "@/lib/billing/subscription-access";
import { getActiveAnnouncementsForUser } from "@/actions/announcements";
import { getUnreadNotificationCount } from "@/actions/notifications";
import { PortalSidebar } from "@/components/portal/sidebar";
import { PortalMobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { GlobalAnnouncementCenter } from "@/components/announcements/global-announcement-center";
import { MAIN_CONTENT_PAD, MAIN_WITH_SIDEBAR, MOBILE_BOTTOM_PAD, SHELL_BG } from "@/lib/layout-classes";
import { cn } from "@/lib/utils";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect("/login");
  if (canAccessSuperAdmin(session.user.role)) redirect("/super-admin");

  const [subscriptionAccess, unreadNotifications, announcements] = await Promise.all([
    getUserSubscriptionAccess(session.user.id),
    getUnreadNotificationCount(),
    getActiveAnnouncementsForUser(),
  ]);

  return (
    <div className={SHELL_BG}>
      <PortalSidebar unreadNotifications={unreadNotifications} />
      <main className={cn(MAIN_WITH_SIDEBAR)}>
        <SubscriptionBanner access={subscriptionAccess} />
        <GlobalAnnouncementCenter announcements={announcements} />
        <div className={cn(MAIN_CONTENT_PAD, MOBILE_BOTTOM_PAD, "min-h-0 flex-1")}>{children}</div>
      </main>
      <PortalMobileBottomNav unreadCount={unreadNotifications} />
    </div>
  );
}
