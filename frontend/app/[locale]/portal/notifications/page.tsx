import { apiGet } from "@/lib/api-client";
import { NotificationsList } from "@/components/portal/notifications-list";

export default async function PortalNotificationsPage() {
  const res = await apiGet("/notifications");
  const notifications = res?.data || res || [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <NotificationsList notifications={Array.isArray(notifications) ? notifications : []} />
    </div>
  );
}
