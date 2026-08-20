"use client";

import { useGetDatabaseStatsQuery } from "@/lib/store/api/super-admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDatabasePage() {
  const { data, isLoading, error } = useGetDatabaseStatsQuery();
  const res = data?.data || data || {};
  const tables = res.tables || res;

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-500">Loading database monitor stats from Express API...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error loading database stats</div>;
  }

  const rows = Object.entries(tables || {}).map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Database Monitor</h1>
        <p className="text-zinc-500">Live record counts across core tables.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500">{r.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{String(r.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          Run <code className="rounded bg-zinc-100 px-1">npx prisma db pull</code> for schema sync or use your
          database provider&apos;s automated backup for production snapshots.
        </CardContent>
      </Card>
    </div>
  );
}
