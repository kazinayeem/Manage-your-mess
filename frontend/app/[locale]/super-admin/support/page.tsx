"use client";

import { SupportTicketsManager } from "@/components/super-admin/support-tickets-manager";

export default function SuperAdminSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-zinc-500">Review and resolve user support requests.</p>
      </div>
      <SupportTicketsManager />
    </div>
  );
}
