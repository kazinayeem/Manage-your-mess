import { AnnouncementsManager } from "@/components/super-admin/announcements-manager";

export default function SuperAdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-zinc-500">Broadcast in-app notifications to all active users.</p>
      </div>
      <AnnouncementsManager />
    </div>
  );
}
