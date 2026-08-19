import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-zinc-500">Environment configuration (read-only). Update via deployment secrets.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <p>NODE_ENV: {process.env.NODE_ENV ?? "development"}</p>
          <p>Database: {process.env.DATABASE_URL ? "Configured" : "Not set"}</p>
          <p>Auth: {process.env.AUTH_SECRET ? "Configured" : "Not set"}</p>
          <p>Google OAuth: {process.env.AUTH_GOOGLE_ID ? "Enabled" : "Disabled"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
