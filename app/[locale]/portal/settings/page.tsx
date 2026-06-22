import { setRequestLocale } from "next-intl/server";
import { PortalSettingsView } from "@/components/portal/portal-settings-view";

export default async function PortalSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortalSettingsView />;
}
