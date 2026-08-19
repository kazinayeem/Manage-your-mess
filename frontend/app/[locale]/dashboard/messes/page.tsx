import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus, Users } from "lucide-react";

export default async function MessesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  const owned = messes.filter((m) => m.mess.ownerId === session.user!.id);
  const joined = messes.filter((m) => m.mess.ownerId !== session.user!.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Messes</h1>
          <p className="text-sm text-zinc-500">
            One account can own multiple messes or join others as a member.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/messes/new"><Plus className="h-4 w-4" /> Create Mess</Link>
        </Button>
      </div>

      {owned.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Owned by you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((m) => (
              <MessCard key={m.id} membership={m} isOwner />
            ))}
          </div>
        </section>
      )}

      {joined.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Joined as member</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((m) => (
              <MessCard key={m.id} membership={m} />
            ))}
          </div>
        </section>
      )}

      {messes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            No messes yet. Create one (you become owner) or join with an invite code.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessCard({
  membership: m,
  isOwner,
}: {
  membership: Awaited<ReturnType<typeof getUserMesses>>[number];
  isOwner?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{m.mess.name}</CardTitle>
          <Badge variant={m.status === "ACTIVE" ? "success" : "secondary"}>{m.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-500">{m.mess.address ?? "No address"}</p>
        <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-xs text-zinc-500">Invite code (this mess only)</p>
          <p className="font-mono text-sm font-semibold tracking-wide">{m.mess.inviteCode}</p>
        </div>
        <p className="text-sm">
          <Users className="mr-1 inline h-3 w-3" />
          {isOwner ? "Owner" : m.role === "MESS_MANAGER" ? "Manager" : "Member"}
        </p>
        {isOwner && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/settings">Invite & Settings</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
