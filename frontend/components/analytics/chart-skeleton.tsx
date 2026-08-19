"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card className="border-zinc-200">
      <CardContent className="p-4">
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div
          className="animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-zinc-200">
          <CardContent className="p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
