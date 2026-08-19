import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

const reportTypes = [
  "Daily Report", "Weekly Report", "Monthly Report", "Yearly Report",
  "Member Report", "Meal Report", "Expense Report", "Deposit Report", "Balance Sheet",
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((type) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base">{type}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline">PDF</Button>
              <Button size="sm" variant="outline">Excel</Button>
              <Button size="sm" variant="outline">CSV</Button>
              <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
