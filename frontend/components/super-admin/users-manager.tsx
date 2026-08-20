"use client";

import { useState } from "react";
import {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from "@/lib/store/api/super-admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { UserRole } from "@/types/domain";

export function UsersManager() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useGetAdminUsersQuery({ search });
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateStatus] = useUpdateUserStatusMutation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const users = data?.data || data || [];

  async function toggleActive(user: any) {
    setLoadingId(user.id);
    try {
      await updateStatus({ userId: user.id, isActive: !user.isActive }).unwrap();
      toast.success(user.isActive ? "User suspended" : "User activated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update status");
    }
    setLoadingId(null);
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading users from Express API</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid gap-3">
        {Array.isArray(users) && users.map((u: any) => (
          <Card key={u.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{u.name ?? "—"}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={u.isActive ? "default" : "destructive"}>
                    {u.isActive ? "Active" : "Suspended"}
                  </Badge>
                  <Badge variant="outline">{u.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-zinc-500">{u.email}</p>
              <p>
                {u._count?.members ?? 0} mess membership(s) · {u._count?.ownedMesses ?? u._count?.subscriptions ?? 0} owned/subscription(s)
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingId === u.id}
                  onClick={() => toggleActive(u)}
                >
                  {u.isActive ? "Suspend" : "Activate"}
                </Button>
                <select
                  className="rounded-md border px-2 py-1 text-sm bg-background"
                  value={u.role}
                  onChange={async (e) => {
                    try {
                      await updateRole({ userId: u.id, role: e.target.value }).unwrap();
                      toast.success("Role updated");
                    } catch (err: any) {
                      toast.error(err?.data?.message || "Failed to update role");
                    }
                  }}
                >
                  {["MEMBER", "MESS_MANAGER", "MESS_OWNER", "ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].map(
                    (r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    )
                  )}
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
