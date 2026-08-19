"use client";

import { messPath } from "@/lib/mess-routes";
import type { MessCapabilities } from "@/lib/mess-permissions";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StartNewMonthDialog } from "@/components/mess/start-new-month-dialog";
import { Wallet, Utensils, Receipt, UserPlus, CalendarPlus, FileText } from "lucide-react";

export function QuickActions({
  messId,
  capabilities,
  isManager = false,
}: {
  messId?: string;
  capabilities?: MessCapabilities;
  isManager?: boolean;
} = {}) {
  const t = useTranslations("quickActions");

  if (!messId || !capabilities || capabilities.readOnly) return null;

  const p = (segment: string) => messPath(messId, segment);

  const linkActions = [
    { href: p("/deposits/add"), label: t("addDeposit"), icon: Wallet, show: capabilities.canAddDeposits },
    { href: p("/meals/add"), label: t("addMeal"), icon: Utensils, show: capabilities.canAddMeals },
    { href: p("/expenses/add"), label: t("addMealCost"), icon: Receipt, show: capabilities.canAddExpenses },
    { href: p("/members/add"), label: t("addMember"), icon: UserPlus, show: isManager },
    { href: p("/reports"), label: t("pdfReport"), icon: FileText, show: capabilities.canGenerateReports },
  ].filter((a) => a.show);

  const showStartMonth = capabilities.canStartMonth;

  if (!linkActions.length && !showStartMonth) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {linkActions.map(({ href, label, icon: Icon }) => (
        <Button key={href} variant="outline" size="sm" asChild>
          <Link href={href}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
      {showStartMonth && (
        <StartNewMonthDialog messId={messId}>
          <Button variant="outline" size="sm" type="button">
            <CalendarPlus className="h-4 w-4" />
            {t("startNewMonth")}
          </Button>
        </StartNewMonthDialog>
      )}
    </div>
  );
}
