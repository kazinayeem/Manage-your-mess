"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateUserRole, updateUserStatus } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  _count: { members: number; subscriptions: number };
};

export function UsersManager({ users: initial }: { users: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const users = initial.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleActive(user: UserRow) {
    setLoadingId(user.id);
    const r = await updateUserStatus(user.id, !user.isActive);
    if (r.success) {
      toast.success(user.isActive ? "User suspended" : "User activated");
      router.refresh();
    } else toast.error(r.error);
    setLoadingId(null);
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
        {users.map((u) => (
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
                {u._count.members} mess membership(s) · {u._count.subscriptions} subscription(s)
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
                  className="rounded-md border px-2 py-1 text-sm"
                  value={u.role}
                  onChange={async (e) => {
                    const r = await updateUserRole(u.id, e.target.value as UserRole);
                    if (r.success) {
                      toast.success("Role updated");
                      router.refresh();
                    } else toast.error(r.error);
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
