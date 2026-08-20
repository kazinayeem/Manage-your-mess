"use client";

import { UsersManager } from "@/components/super-admin/users-manager";

export default function SuperAdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-zinc-500">Approve, suspend, ban, and manage platform users.</p>
      </div>
      <UsersManager />
    </div>
  );
}
