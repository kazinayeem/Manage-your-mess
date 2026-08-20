import { apiGet } from "@/lib/api-client";
import { AnnouncementsHistory } from "@/components/portal/announcements-history";

export default async function PortalAnnouncementsPage() {
  const res = await apiGet("/announcements/user");
  const announcements = res?.data || res || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-zinc-500">
          Read global platform announcements, maintenance updates, and critical alerts.
        </p>
      </div>
      <AnnouncementsHistory announcements={Array.isArray(announcements) ? announcements : []} />
    </div>
  );
}
