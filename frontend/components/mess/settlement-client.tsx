"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SettlementClient({ messId, monthId }: { messId: string; monthId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSettle() {
    setLoading(true);
    try {
      const result = await apiPost(`/messes/${messId}/settle`, { monthId });
      if (!result.success) toast.error(result.message || "Settlement failed");
      else toast.success("Month settled and balances recalculated");
    } catch {
      toast.error("Settlement failed");
    }
    setLoading(false);
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader><CardTitle>Monthly Settlement</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-500">
          Recalculate meal rate, member dues, and save a settlement snapshot for the current month.
        </p>
        <Button className="w-full" onClick={handleSettle} disabled={loading}>
          {loading ? "Settling..." : "Run Settlement"}
        </Button>
      </CardContent>
    </Card>
  );
}
