import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteCard } from "@/components/mess/invite-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/messes/new">Create Another Mess</Link>
        </Button>
      </div>

      {ctx && (
        <>
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
                <Badge>{ctx.member.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Owner</span>
                <span>{ctx.mess.owner?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Manager</span>
                <span>{ctx.mess.manager?.name ?? "—"}</span>
              </div>
              {ctx.isOwner && (
                <p className="pt-2 text-xs text-zinc-500">
                  As owner you can assign a manager under Change Manager. Owner role cannot be
                  transferred.
                </p>
              )}
            </CardContent>
          </Card>

          {ctx.canManageInvite && (
            <InviteCard
              messId={ctx.messId}
              messName={ctx.mess.name}
              inviteCode={ctx.mess.inviteCode}
            />
          )}
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Name</span><span>{session.user.name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Email</span><span>{session.user.email}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Platform role</span><Badge>{session.user.role}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>All your messes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ctx?.allMesses.map((m) => (
              <div key={m.messId} className="flex justify-between rounded-lg border p-2 dark:border-zinc-800">
                <span>{m.name}</span>
                <span className="text-zinc-500">{m.isOwner ? "Owner" : m.role}</span>
              </div>
            )) ?? <p className="text-zinc-500">No messes yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
