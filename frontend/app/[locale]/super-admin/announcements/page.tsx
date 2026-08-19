import { getAdminAnnouncements } from "@/actions/announcements";
import { getAdminMesses } from "@/actions/super-admin";
import { AnnouncementsManager } from "@/components/super-admin/announcements-manager";

export default async function SuperAdminAnnouncementsPage() {
  const [announcements, messes] = await Promise.all([
    getAdminAnnouncements(),
    getAdminMesses(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-zinc-500">Publish targeted global announcements with delivery history and read tracking.</p>
      </div>
      <AnnouncementsManager announcements={announcements} messes={messes.map((mess) => ({ id: mess.id, name: mess.name }))} />
    </div>
  );
}
