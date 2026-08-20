export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MESS_OWNER"
  | "MESS_MANAGER"
  | "ASSISTANT_MANAGER"
  | "ACCOUNTANT"
  | "MEMBER"
  | "GUEST";

export type MemberStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "LEFT";

export type MessStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED";

export type PaymentRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED"
  | "NEEDS_INFO"
  | "CANCELLED";

export type SubscriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "CANCELLED"
  | "PAST_DUE"
  | "TRIALING"
  | "EXPIRED"
  | "SUSPENDED";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type PlanTier =
  | "FREE"
  | "PRO"
  | "BUSINESS"
  | "ENTERPRISE";

export type DepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED";

export type BillStatus =
  | "PENDING"
  | "PAID"
  | "OVERDUE";

export type PlanDurationType =
  | "DAYS"
  | "WEEKS"
  | "MONTHS"
  | "YEARS"
  | "CUSTOM_DATE";

export type PlanVisibility =
  | "PUBLIC"
  | "HIDDEN"
  | "PRIVATE";

export type AuditAction = string;

export type NotificationType = string;

export type BillSplitMethod =
  | "EQUAL"
  | "BY_MEMBERS"
  | "ROOM_BASED"
  | "CUSTOM"
  | "PERCENTAGE";

export type BillCategoryType = string;
