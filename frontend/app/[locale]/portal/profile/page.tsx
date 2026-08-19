import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{session.user.name}</p>
        <p>{session.user.email}</p>
      </CardContent>
    </Card>
  );
}
