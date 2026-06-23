import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  Utensils,
  Receipt,
  Zap,
  ShoppingCart,
  Users,
  UserCog,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  CalendarDays,
  LayoutGrid,
} from "lucide-react";
import { messPath } from "@/lib/mess-routes";
import { canViewBazaarAdmin } from "@/lib/bazaar-access";
import type { MessCapabilities } from "@/lib/mess-permissions";

export type NavItem = {
  segment: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
  show?: (cap: MessCapabilities, isManager: boolean, isOwner: boolean) => boolean;
  dialog?: "start-month";
};

export type NavGroup = {
  id: string;
  labelKey: string;
  items: NavItem[];
};

function p(messId: string, segment: string) {
  return messPath(messId, segment);
}

export function buildMessNavGroups(
  messId: string,
  cap: MessCapabilities,
  isManager: boolean,
  isOwner: boolean
) {
  const filter = (items: NavItem[]) =>
    items
      .filter((item) => !item.show || item.show(cap, isManager, isOwner))
      .map((item) => ({
        href: p(messId, item.segment),
        labelKey: item.labelKey,
        icon: item.icon,
        exact: item.exact,
        dialog: item.dialog,
      }));

  if (cap.readOnly || cap.subscriptionLocked) {
    const groups: NavGroup[] = [
      {
        id: "main",
        labelKey: "navGroupMain",
        items: [
          { segment: "", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
          { segment: "/current-month", labelKey: "currentMonth", icon: Calendar },
        ],
      },
      {
        id: "finance",
        labelKey: "navGroupFinance",
        items: [
          { segment: "/deposits", labelKey: "myDeposits", icon: Wallet },
          { segment: "/meals", labelKey: "myMeals", icon: Utensils },
          { segment: "/expenses", labelKey: "messCosts", icon: Receipt },
          { segment: "/bills", labelKey: "billsUtilities", icon: Zap },
        ],
      },
      {
        id: "bazaar",
        labelKey: "navGroupBazaar",
        items: [
          { segment: "/bazaar/my", labelKey: "myBazaar", icon: ShoppingCart, show: (c) => c.canViewMyBazaar },
          {
            segment: "/bazaar/history",
            labelKey: "bazaarHistory",
            icon: ShoppingCart,
            show: (c, _m, o) => canViewBazaarAdmin(c, o),
          },
          {
            segment: "/bazaar/reports",
            labelKey: "bazaarReports",
            icon: ShoppingCart,
            show: (c, _m, o) => canViewBazaarAdmin(c, o),
          },
        ],
      },
      {
        id: "reports",
        labelKey: "navGroupReports",
        items: [
          { segment: "/analytics", labelKey: "analytics", icon: BarChart3, show: (c) => c.canGenerateReports },
          { segment: "/reports", labelKey: "reports", icon: FileText, show: (c) => c.canGenerateReports },
        ],
      },
    ];
    return groups.map((g) => ({ ...g, items: filter(g.items) })).filter((g) => g.items.length > 0);
  }

  const groups: NavGroup[] = [
    {
      id: "main",
      labelKey: "navGroupMain",
      items: [
        { segment: "", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
        { segment: "/current-month", labelKey: "currentMonth", icon: Calendar },
        { segment: "/months", labelKey: "allMonths", icon: CalendarDays },
        {
          segment: "/months/new",
          labelKey: "startNewMonth",
          icon: CalendarDays,
          show: (c) => c.canStartMonth,
          dialog: "start-month",
        },
      ],
    },
    {
      id: "finance",
      labelKey: "navGroupFinance",
      items: [
        { segment: "/deposits/add", labelKey: "addDeposit", icon: Wallet, show: (c) => c.canAddDeposits },
        { segment: "/meals/add", labelKey: "addMeal", icon: Utensils, show: (c) => c.canAddMeals },
        { segment: "/expenses/add", labelKey: "addMealCost", icon: Receipt, show: (c) => c.canAddExpenses },
        { segment: "/bills", labelKey: "billsUtilities", icon: Zap },
        { segment: "/bills/add", labelKey: "addBill", icon: Zap, show: (c) => c.canManageBills },
      ],
    },
    {
      id: "bazaar",
      labelKey: "navGroupBazaar",
      items: [
        {
          segment: "/bazaar",
          labelKey: "bazaarList",
          icon: ShoppingCart,
          show: (c, _m, o) => canViewBazaarAdmin(c, o),
        },
        { segment: "/bazaar/assigned", labelKey: "assignedBazaar", icon: ShoppingCart, show: (c) => c.canManageBazaar },
        { segment: "/bazaar/my", labelKey: "myBazaar", icon: ShoppingCart, show: (c) => c.canViewMyBazaar },
        {
          segment: "/bazaar/history",
          labelKey: "bazaarHistory",
          icon: ShoppingCart,
          show: (c, _m, o) => canViewBazaarAdmin(c, o),
        },
        {
          segment: "/bazaar/reports",
          labelKey: "bazaarReports",
          icon: ShoppingCart,
          show: (c, _m, o) => canViewBazaarAdmin(c, o),
        },
      ],
    },
    {
      id: "members",
      labelKey: "navGroupMembers",
      items: [
        {
          segment: "/members",
          labelKey: "members",
          icon: Users,
          show: (c) => c.canViewMembers || c.canManageMembers,
        },
        { segment: "/members/add", labelKey: "addMember", icon: Users, show: (_c, mgr) => mgr },
        { segment: "/settings/manager", labelKey: "changeManager", icon: UserCog, show: (c) => c.canChangeManager },
      ],
    },
    {
      id: "reports",
      labelKey: "navGroupReports",
      items: [
        { segment: "/reports", labelKey: "pdfReports", icon: FileText, show: (c) => c.canGenerateReports },
        { segment: "/analytics", labelKey: "analytics", icon: BarChart3, show: (c) => c.canViewAnalytics },
        { segment: "/settlement", labelKey: "settlement", icon: Receipt, show: (c) => c.canGenerateReports },
      ],
    },
    {
      id: "settings",
      labelKey: "navGroupSettings",
      items: [
        { segment: "/settings", labelKey: "inviteSettings", icon: Settings, show: (c) => c.canManageSettings },
      ],
    },
  ];

  return groups.map((g) => ({ ...g, items: filter(g.items) })).filter((g) => g.items.length > 0);
}

/** Mobile bottom tab route matchers */
export function isFinanceRoute(path: string, messId: string) {
  const base = messPath(messId);
  return ["/deposits", "/meals", "/expenses", "/bills"].some(
    (s) => path.startsWith(`${base}${s}`)
  );
}

export function isBazaarRoute(path: string, messId: string) {
  return path.startsWith(messPath(messId, "/bazaar"));
}

export function isReportsRoute(path: string, messId: string) {
  const base = messPath(messId);
  return (
    path.startsWith(`${base}/reports`) ||
    path.startsWith(`${base}/analytics`) ||
    path.startsWith(`${base}/settlement`)
  );
}

export const PORTAL_MORE_LINKS = [
  { href: "/portal", labelKey: "portalHome", icon: LayoutGrid },
  { href: "/pricing", labelKey: "pricing", icon: Receipt },
  { href: "/portal/subscription", labelKey: "subscription", icon: Wallet },
  { href: "/portal/payments", labelKey: "payments", icon: Receipt },
  { href: "/portal/announcements", labelKey: "announcements", icon: LayoutGrid },
  { href: "/portal/settings", labelKey: "settings", icon: Settings },
] as const;
