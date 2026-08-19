import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function SuperAdminNotificationTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Templates</h1>
        <p className="text-zinc-500">Billing and system notifications are sent automatically. Broadcast custom messages via announcements.</p>
      </div>
      <Card>
        <CardContent className="py-4">
          <Link href="/super-admin/announcements" className="text-emerald-600 hover:underline">
            Create announcement →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
