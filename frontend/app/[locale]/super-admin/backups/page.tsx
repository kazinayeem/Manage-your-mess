import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminBackupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Backup Manager</h1>
        <p className="text-zinc-500">Database backup guidance and monitoring.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recommended workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600">
          <p>1. Enable automated daily backups on your database host (Neon, Supabase, RDS, etc.).</p>
          <p>2. Use <Link href="/super-admin/database" className="text-emerald-600 hover:underline">Database Monitor</Link> for live table counts.</p>
          <p>3. Export schema: <code className="rounded bg-zinc-100 px-1">npx prisma db pull</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
