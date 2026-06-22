"use client";

import { useRouter } from "@/i18n/navigation";
import { switchActiveMess } from "@/actions/mess";
import { useMessStore } from "@/stores";
import { toast } from "sonner";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessOption = {
  messId: string;
  name: string;
  role: string;
  status: string;
  isOwner: boolean;
};

export function MessSwitcher({
  messes,
  activeMessId,
}: {
  messes: MessOption[];
  activeMessId?: string;
}) {
  const router = useRouter();
  const setActiveMessId = useMessStore((s) => s.setActiveMessId);
  const active = messes.find((m) => m.messId === activeMessId) ?? messes[0];

  if (!messes.length) return null;

  async function handleChange(messId: string) {
    if (messId === activeMessId) return;
    const result = await switchActiveMess(messId);
    if (!result.success) {
      toast.error("error" in result ? result.error : "Could not switch mess");
      return;
    }
    setActiveMessId(messId);
    router.refresh();
  }

  if (messes.length === 1) {
    return (
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span className="truncate font-medium">{active?.name}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {active?.isOwner ? "Owner" : active?.role.replace("_", " ")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <label className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Building2 className="h-3 w-3" />
        Active Mess
      </label>
      <div className="relative">
        <select
          value={activeMessId ?? active?.messId}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          )}
        >
          {messes.map((m) => (
            <option key={m.messId} value={m.messId}>
              {m.name} ({m.isOwner ? "Owner" : m.role === "MESS_MANAGER" ? "Manager" : "Member"})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Each mess has its own invite code in Settings.
      </p>
    </div>
  );
}
