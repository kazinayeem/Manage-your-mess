import { formatMealPortion } from "@/lib/calculations";
import { requireMessPage } from "@/lib/require-mess-page";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MessMemberMealsPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId);
  const month = ctx.currentMonth ?? (await ensureCurrentMonth(ctx.messId));

  const entries = await db.mealEntry.findMany({
    where: { memberId: ctx.member.id, meal: { monthId: month.id } },
    include: { meal: { select: { date: true } } },
    orderBy: { meal: { date: "desc" } },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Meals</h1>
      <Card>
        <CardHeader>
          <CardTitle>{month.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500">No meal entries yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {entries.map((e) => (
                <li key={e.id} className="flex justify-between py-2">
                  <span>{e.meal.date.toLocaleDateString()}</span>
                  <span>
                    B:{formatMealPortion(e.breakfast)} L:{formatMealPortion(e.lunch)} D:
                    {formatMealPortion(e.dinner)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
