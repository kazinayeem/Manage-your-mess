"use client";

import { MessesManager } from "@/components/super-admin/messes-manager";

export default function SuperAdminMessesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mess Management</h1>
        <p className="text-zinc-500">View, suspend, and manage all platform messes.</p>
      </div>
      <MessesManager />
    </div>
  );
}
