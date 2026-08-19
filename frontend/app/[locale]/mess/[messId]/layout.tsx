import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { canAccessSuperAdmin } from "@/lib/route-guard";
import { getMessContextById } from "@/lib/mess-context";
import { getActiveAnnouncementsForUser } from "@/actions/announcements";
import { MessWorkspaceSidebar } from "@/components/mess/workspace-sidebar";
import { PortalMessSwitcher } from "@/components/portal/mess-switcher";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { GlobalAnnouncementCenter } from "@/components/announcements/global-announcement-center";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";
import { Link } from "@/i18n/navigation";
import { MessMobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileFab } from "@/components/mobile/mobile-fab";
import {
  MAIN_WITH_SIDEBAR,
  MOBILE_BOTTOM_PAD,
  SHELL_BG,
  STICKY_TOPBAR,
  STICKY_TOPBAR_INNER,
} from "@/lib/layout-classes";
import { cn } from "@/lib/utils";

export default async function MessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; messId: string }>;
}) {
  const { locale, messId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect("/login");
  if (canAccessSuperAdmin(session.user.role)) redirect("/super-admin");

  const ctx = await getMessContextById(messId);
  if (!ctx) notFound();
  const announcements = await getActiveAnnouncementsForUser();

  const tRoles = await getTranslations("roles");
  const tWorkspace = await getTranslations("workspace");
  const readOnly = ctx.capabilities.readOnly;
  const roleLabel = getMessDisplayRoleLabel(ctx.effectiveRole, tRoles, {
    isLegalOwner: ctx.isOwner && !ctx.isManager,
    isActiveManager: ctx.isManager,
  });

  return (
    <div className={SHELL_BG}>
      <MessWorkspaceSidebar
        messId={messId}
        messName={ctx.mess.name}
        capabilities={ctx.capabilities}
        readOnly={readOnly}
        isManager={ctx.isManager}
        isOwner={ctx.isOwner}
      />

      <div className={MAIN_WITH_SIDEBAR}>
        <header className={STICKY_TOPBAR}>
          <div className={STICKY_TOPBAR_INNER}>
            <PortalMessSwitcher
              messes={ctx.allMesses.map((m) => ({
                messId: m.messId,
                name: m.name,
                role: m.role,
                isOwner: m.isOwner,
                isManager: m.isManager,
              }))}
              activeMessId={messId}
            />
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <LocaleSwitcher />
              {readOnly && <Badge variant="secondary">{tWorkspace("readOnly")}</Badge>}
              <Badge variant="outline" className="hidden sm:inline-flex">
                {roleLabel}
              </Badge>
              <Link href="/portal" className="text-sm text-emerald-600 hover:underline">
                {tWorkspace("portal")}
              </Link>
            </div>
          </div>
        </header>

        <SubscriptionBanner access={ctx.subscriptionAccess} />
        <GlobalAnnouncementCenter announcements={announcements} />

        <main className={cn("min-h-0 min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8", MOBILE_BOTTOM_PAD)}>
          {readOnly && ctx.subscriptionAccess.isSuspended && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {tWorkspace("suspendedReadOnlyHint")}
            </p>
          )}
          {children}
        </main>
      </div>

      <MessMobileBottomNav
        messId={messId}
        capabilities={ctx.capabilities}
        isManager={ctx.isManager}
        isOwner={ctx.isOwner}
      />
      <MobileFab messId={messId} canWrite={!readOnly} capabilities={ctx.capabilities} />
    </div>
  );
}
