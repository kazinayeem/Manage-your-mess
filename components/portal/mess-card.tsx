"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { messPath } from "@/lib/mess-routes";
import type { PortalMessCard } from "@/lib/portal-queries";
import { getMessDisplayRoleLabel } from "@/lib/mess-role-label";
import { formatDistanceToNow } from "date-fns";
import { bn as bnLocale, enUS } from "date-fns/locale";

export function MessCard({ mess }: { mess: PortalMessCard }) {
  const t = useTranslations("portal");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const dateLocale = locale === "bn" ? bnLocale : enUS;

  const roleLabel = getMessDisplayRoleLabel(mess.roleRaw, tRoles, {
    isLegalOwner: mess.isLegalOwner,
    isActiveManager: mess.isManager,
  });

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {mess.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mess.logo} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950">
              <Building2 className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{mess.name}</h3>
            <p className="text-sm text-zinc-500">
              {t("role")}: {roleLabel}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">{t("members")}</dt>
            <dd className="font-medium">{mess.memberCount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("plan")}</dt>
            <dd className="font-medium capitalize">{mess.plan.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("month")}</dt>
            <dd className="font-medium">{mess.currentMonth ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("status")}</dt>
            <dd>
              <Badge variant={mess.status === "ACTIVE" ? "default" : "secondary"}>
                {mess.status === "ACTIVE" ? t("active") : t("pending")}
              </Badge>
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-zinc-400">
          {t("lastActivity", {
            time: formatDistanceToNow(mess.lastActivity, { addSuffix: true, locale: dateLocale }),
          })}
        </p>

        <Button asChild className="mt-4 w-full">
          <Link href={messPath(mess.messId)}>{t("openMess")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
