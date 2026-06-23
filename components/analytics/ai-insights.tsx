"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function AiInsights({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;
  return (
    <Card className="border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </div>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          {insights.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-zinc-400">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
