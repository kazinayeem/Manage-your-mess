"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { approveMember, rejectMember } from "@/actions/mess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, UserX } from "lucide-react";

export type PendingMember = {
  id: string;
  fullName: string | null;
  email?: string | null;
};

export function PendingMembersPanel({
  messId,
  members,
}: {
  messId: string;
  members: PendingMember[];
}) {
  const router = useRouter();
  const t = useTranslations("pendingMembers");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!members.length) return null;

  async function handleApprove(memberId: string) {
    setLoadingId(memberId);
    const result = await approveMember(messId, memberId);
    if (result.success) {
      toast.success(t("approveSuccess"));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  }

  async function handleReject(memberId: string) {
    setLoadingId(memberId);
    const result = await rejectMember(messId, memberId);
    if (result.success) {
      toast.success(t("rejectSuccess"));
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-300">
          <UserCheck className="h-5 w-5" />
          {t("title")}
          <Badge variant="secondary">{members.length}</Badge>
        </CardTitle>
        <p className="text-sm text-amber-700/80 dark:text-amber-400/80">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 dark:border-amber-900 dark:bg-zinc-950"
          >
            <div>
              <p className="font-medium">{m.fullName ?? t("unnamed")}</p>
              {m.email && <p className="text-xs text-zinc-500">{m.email}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={loadingId === m.id}
                onClick={() => handleApprove(m.id)}
              >
                <UserCheck className="h-4 w-4" />
                {t("approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingId === m.id}
                onClick={() => handleReject(m.id)}
              >
                <UserX className="h-4 w-4" />
                {t("reject")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
