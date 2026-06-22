import { getAdminUsers } from "@/actions/super-admin";
import { UsersManager } from "@/components/super-admin/users-manager";

export default async function SuperAdminUsersPage() {
  const users = await getAdminUsers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-zinc-500">Approve, suspend, ban, and manage platform users.</p>
      </div>
      <UsersManager users={users} />
    </div>
  );
}
