import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BazaarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const entries = await db.bazaarEntry.findMany({
    where: { messId: messes[0].messId, deletedAt: null },
    include: { vendor: true },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bazaar Management</h1>
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-base">{entry.vendor?.name ?? "General Bazaar"}</CardTitle>
                <span className="font-semibold text-emerald-600">{formatCurrency(entry.totalAmount)}</span>
              </div>
              <p className="text-xs text-zinc-500">{formatDate(entry.date)}</p>
            </CardHeader>
            {entry.notes && <CardContent><p className="text-sm text-zinc-500">{entry.notes}</p></CardContent>}
          </Card>
        ))}
        {entries.length === 0 && (
          <Card><CardContent className="py-12 text-center text-zinc-500">No bazaar entries yet</CardContent></Card>
        )}
      </div>
    </div>
  );
}
