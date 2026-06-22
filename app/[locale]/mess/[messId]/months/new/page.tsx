import { requireMessPage } from "@/lib/require-mess-page";
import StartNewMonthClient from "@/components/mess/start-month-client";

export default async function MessNewMonthPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  const ctx = await requireMessPage(messId, { capability: "canStartMonth" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Start New Month</h1>
      <StartNewMonthClient messId={ctx.messId} />
    </div>
  );
}
