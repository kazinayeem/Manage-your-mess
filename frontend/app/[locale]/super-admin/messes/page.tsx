import { getAdminMesses } from "@/actions/super-admin";
import { MessesManager } from "@/components/super-admin/messes-manager";

export default async function SuperAdminMessesPage() {
  const messes = await getAdminMesses();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mess Management</h1>
        <p className="text-zinc-500">View, suspend, and manage all platform messes.</p>
      </div>
      <MessesManager messes={messes} />
    </div>
  );
}
