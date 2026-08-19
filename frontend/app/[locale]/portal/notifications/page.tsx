import { getUserNotifications } from "@/actions/notifications";
import { NotificationsList } from "@/components/portal/notifications-list";

export default async function PortalNotificationsPage() {
  const notifications = await getUserNotifications();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
