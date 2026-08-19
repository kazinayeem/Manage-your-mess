import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type Feature = { label: string; done?: boolean };

export function SuperAdminSection({
  title,
  description,
  features,
  icon: Icon,
}: {
  title: string;
  description: string;
  features: Feature[];
  icon?: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-zinc-500">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned capabilities</CardTitle>
          <CardDescription>Platform administration — separate from mess operations</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <span
                  className={
                    f.done
                      ? "text-emerald-600"
                      : "text-zinc-400"
                  }
                >
                  {f.done ? "✓" : "○"}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
