import { redirect } from "next/navigation";
import { getActiveMessContext } from "@/lib/mess-context";
import StartNewMonthClient from "@/components/mess/start-month-client";

export default async function StartNewMonthPage() {
  const ctx = await getActiveMessContext();
  if (!ctx) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Start New Month</h1>
      <StartNewMonthClient messId={ctx.messId} />
    </div>
  );
}
