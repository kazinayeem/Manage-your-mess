import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessSuperAdmin } from "@/lib/route-guard";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";
import { MAIN_CONTENT_PAD, MAIN_WITH_SIDEBAR, SHELL_BG } from "@/lib/layout-classes";
import { cn } from "@/lib/utils";

export default async function SuperAdminLayout({
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
  if (!canAccessSuperAdmin(session.user.role)) redirect("/dashboard");

  return (
    <div className={SHELL_BG}>
      <SuperAdminSidebar />
      <main className={MAIN_WITH_SIDEBAR}>
        <div className={cn(MAIN_CONTENT_PAD, "min-h-0 flex-1")}>{children}</div>
      </main>
    </div>
  );
}
