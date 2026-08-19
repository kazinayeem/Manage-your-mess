import { redirect } from "next/navigation";
import { requireMessPage } from "@/lib/require-mess-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteCard } from "@/components/mess/invite-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatMessDisplayRole } from "@/lib/mess-permissions";

export default async function MessSettingsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canManageSettings" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portal/create-mess">Create Another Mess</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mess roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Mess</span>
            <span className="font-medium">{ctx.mess.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Your role</span>
            <Badge>
              {formatMessDisplayRole(ctx.effectiveRole, {
                isLegalOwner: ctx.isOwner && !ctx.isManager,
                isActiveManager: ctx.isManager,
              })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {ctx.canManageInvite && (
        <InviteCard
          messId={ctx.messId}
          messName={ctx.mess.name}
          inviteCode={ctx.mess.inviteCode}
        />
      )}
    </div>
  );
}
