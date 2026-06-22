import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveMessContext } from "@/lib/mess-context";

export default async function MemberProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getActiveMessContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{session.user.name ?? "Member"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{session.user.email}</p>
          {ctx && (
            <>
              <p>Mess: {ctx.mess.name}</p>
              <Badge variant="secondary">{ctx.member.role}</Badge>
              <Badge variant="outline">{ctx.member.status}</Badge>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
