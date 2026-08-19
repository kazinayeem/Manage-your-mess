import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminEmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-zinc-500">
          Transactional emails use system defaults. Use announcements for in-app broadcasts.
        </p>
      </div>
      <Card>
        <CardContent className="py-4">
          <Link href="/super-admin/announcements" className="text-emerald-600 hover:underline">
            Manage in-app announcements →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
