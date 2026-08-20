"use client";

import {
  useGetAdminMessesQuery,
  useApproveMessMutation,
  useRejectMessMutation,
  useSuspendMessMutation,
  useActivateMessMutation,
} from "@/lib/store/api/super-admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function MessesManager() {
  const { data, isLoading, error } = useGetAdminMessesQuery();
  const [approveMess] = useApproveMessMutation();
  const [rejectMess] = useRejectMessMutation();
  const [suspendMess] = useSuspendMessMutation();
  const [activateMess] = useActivateMessMutation();

  const messes = data?.data || data || [];

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading messes from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading messes</div>;
  }

  return (
    <div className="grid gap-3">
      {Array.isArray(messes) && messes.map((m: any) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{m.name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={m.status === "ACTIVE" ? "default" : "destructive"}>
                  {m.status ?? "ACTIVE"}
                </Badge>
                <Badge variant="outline">
                  {m.subscription?.status ?? "No sub"} · {m.subscription?.plan?.name ?? "—"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Owner: {m.owner?.name ?? m.owner?.email ?? "—"}</p>
            <p>Manager: {m.manager?.name ?? m.manager?.email ?? "—"}</p>
            <p>{m._count?.members ?? 0} active members</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {m.status !== "ACTIVE" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={async () => {
                    try {
                      await approveMess(m.id).unwrap();
                      toast.success("Mess approved");
                    } catch (e: any) {
                      toast.error(e?.data?.message || "Failed to approve mess");
                    }
                  }}
                >
                  Approve
                </Button>
              )}
              {m.status === "ACTIVE" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await suspendMess(m.id).unwrap();
                      toast.success("Mess suspended");
                    } catch (e: any) {
                      toast.error(e?.data?.message || "Failed to suspend mess");
                    }
                  }}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await activateMess(m.id).unwrap();
                      toast.success("Mess activated");
                    } catch (e: any) {
                      toast.error(e?.data?.message || "Failed to activate mess");
                    }
                  }}
                >
                  Activate
                </Button>
              )}
              {m.status !== "REJECTED" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm(`Reject mess "${m.name}"?`)) return;
                    try {
                      await rejectMess({ messId: m.id, reason: "Rejected by Super Admin" }).unwrap();
                      toast.success("Mess rejected");
                    } catch (e: any) {
                      toast.error(e?.data?.message || "Failed to reject mess");
                    }
                  }}
                >
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
