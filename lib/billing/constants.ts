/** All feature keys Super Admin can toggle per plan */
export const PLAN_FEATURES = {
  PDF_REPORTS: "pdf_reports",
  EXCEL_REPORTS: "excel_reports",
  CSV_EXPORT: "csv_export",
  AI_ANALYTICS: "ai_analytics",
  BRANCH_MANAGEMENT: "branch_management",
  ROOM_MANAGEMENT: "room_management",
  BED_MANAGEMENT: "bed_management",
  VISITOR_MANAGEMENT: "visitor_management",
  AUDIT_LOGS: "audit_logs",
  ADVANCED_REPORTS: "advanced_reports",
  CUSTOM_BRANDING: "custom_branding",
  API_ACCESS: "api_access",
  WEBHOOKS: "webhooks",
  PRIORITY_SUPPORT: "priority_support",
  WHITE_LABEL: "white_label",
  MULTI_BRANCH: "multi_branch",
  ADVANCED_ANALYTICS: "advanced_analytics",
  UNLIMITED_MEMBERS: "unlimited_members",
  UNLIMITED_REPORTS: "unlimited_reports",
  // Core features always available unless explicitly disabled
  MEAL_TRACKING: "meal_tracking",
  EXPENSE_TRACKING: "expense_tracking",
  DEPOSIT_TRACKING: "deposit_tracking",
  MONTHLY_REPORT: "monthly_report",
  NOTICE_BOARD: "notice_board",
  EMAIL_NOTIFICATIONS: "email_notifications",
} as const;

export type PlanFeatureKey = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES];

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  pdf_reports: "PDF Reports",
  excel_reports: "Excel Reports",
  csv_export: "CSV Export",
  ai_analytics: "AI Analytics",
  branch_management: "Branch Management",
  room_management: "Room Management",
  bed_management: "Bed Management",
  visitor_management: "Visitor Management",
  audit_logs: "Audit Logs",
  advanced_reports: "Advanced Reports",
  custom_branding: "Custom Branding",
  api_access: "API Access",
  webhooks: "Webhooks",
  priority_support: "Priority Support",
  white_label: "White Label",
  multi_branch: "Multi Branch",
  advanced_analytics: "Advanced Analytics",
  unlimited_members: "Unlimited Members",
  unlimited_reports: "Unlimited Reports",
  meal_tracking: "Meal Tracking",
  expense_tracking: "Expense Tracking",
  deposit_tracking: "Deposit Tracking",
  monthly_report: "Monthly Report",
  notice_board: "Notice Board",
  email_notifications: "Email Notifications",
};

export const PLAN_LIMIT_KEYS = [
  "members",
  "branches",
  "storage_mb",
  "reports",
  "pdf_exports",
  "excel_exports",
  "monthly_transactions",
  "api_requests",
] as const;

export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[number];

export const PLAN_LIMIT_LABELS: Record<PlanLimitKey, string> = {
  members: "Members Limit",
  branches: "Branch Limit",
  storage_mb: "Storage Limit (MB)",
  reports: "Reports Limit",
  pdf_exports: "PDF Export Limit",
  excel_exports: "Excel Export Limit",
  monthly_transactions: "Monthly Transactions Limit",
  api_requests: "API Requests Limit",
};

export const DURATION_PRESETS = [
  { label: "7 Days", type: "DAYS" as const, value: 7 },
  { label: "15 Days", type: "DAYS" as const, value: 15 },
  { label: "30 Days", type: "DAYS" as const, value: 30 },
  { label: "90 Days", type: "MONTHS" as const, value: 3 },
  { label: "180 Days", type: "MONTHS" as const, value: 6 },
  { label: "365 Days", type: "YEARS" as const, value: 1 },
] as const;

export const EXTENSION_PRESETS = [
  { label: "+7 Days", days: 7 },
  { label: "+30 Days", days: 30 },
  { label: "+90 Days", days: 90 },
  { label: "+180 Days", days: 180 },
  { label: "+365 Days", days: 365 },
] as const;

/** Legacy feature key mapping for old code paths */
export const LEGACY_FEATURE_MAP: Record<string, PlanFeatureKey> = {
  pdf_export: "pdf_reports",
  excel_export: "excel_reports",
  csv_export: "csv_export",
  ai_analytics: "ai_analytics",
  branch_management: "branch_management",
  room_management: "room_management",
  advanced_reports: "advanced_reports",
  audit_logs: "audit_logs",
  custom_branding: "custom_branding",
  api_access: "api_access",
  webhooks: "webhooks",
  custom_integrations: "white_label",
  basic_meal_tracking: "meal_tracking",
  expense_tracking: "expense_tracking",
  deposit_tracking: "deposit_tracking",
  monthly_report: "monthly_report",
  notice_board: "notice_board",
  email_notifications: "email_notifications",
  sms_notifications: "email_notifications",
  dedicated_support: "priority_support",
};
