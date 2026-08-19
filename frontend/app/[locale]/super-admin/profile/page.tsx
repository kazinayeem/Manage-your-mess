import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SuperAdminProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{session.user.name ?? "Super Admin"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{session.user.email}</p>
          <Badge variant="secondary">{session.user.role}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
