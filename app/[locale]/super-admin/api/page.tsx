import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminApiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Management</h1>
        <p className="text-zinc-500">REST API endpoints for integrations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <code className="rounded bg-zinc-100 px-1">GET /api/v1</code> — API health and version info
          </p>
          <p>
            <code className="rounded bg-zinc-100 px-1">POST /api/webhooks</code> — Webhook receiver (audit logged)
          </p>
          <p>
            <code className="rounded bg-zinc-100 px-1">/api/auth/*</code> — NextAuth authentication
          </p>
          <p className="text-zinc-500">Enterprise API keys and rate limits can be added per subscription plan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
