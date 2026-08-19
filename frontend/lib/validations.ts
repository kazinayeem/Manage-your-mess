import { z } from "zod";
import { mealPortionToNumber } from "@/lib/calculations";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const messSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
});

export const memberSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  nid: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  university: z.string().optional(),
  monthlyDeposit: z.coerce.number().min(0).default(0),
});

export const mealPortionValues = ["0", "0.5", "1"] as const;
export type MealPortion = (typeof mealPortionValues)[number];

export const mealEntrySchema = z.object({
  date: z.string(),
  memberId: z.string(),
  breakfast: z.coerce.number().min(0).max(1).default(0),
  lunch: z.coerce.number().min(0).max(1).default(0),
  dinner: z.coerce.number().min(0).max(1).default(0),
  isGuest: z.boolean().default(false),
});

export const mealPortionSchema = z
  .union([z.string(), z.number()])
  .transform((val) => mealPortionToNumber(val));

export const memberMealEntrySchema = z.object({
  memberId: z.string(),
  breakfast: mealPortionSchema,
  lunch: mealPortionSchema,
  dinner: mealPortionSchema,
});

export const bulkMealEntriesSchema = z.object({
  date: z.string(),
  entries: z.array(memberMealEntrySchema).min(1, "Select at least one member"),
});

/** @deprecated Use bulkMealEntriesSchema — same portions for all members */
export const bulkMealEntrySchema = z.object({
  date: z.string(),
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  breakfast: z.coerce.number().min(0).max(1).default(0),
  lunch: z.coerce.number().min(0).max(1).default(0),
  dinner: z.coerce.number().min(0).max(1).default(0),
});

export const billCustomSplitSchema = z.object({
  memberId: z.string(),
  amount: z.coerce.number().min(0),
});

export const billSchema = z.object({
  category: z.enum([
    "HOUSE_RENT", "ELECTRICITY", "WATER", "GAS", "INTERNET",
    "CLEANER_SALARY", "SECURITY_GUARD", "GENERATOR", "MAINTENANCE",
    "GARBAGE", "PARKING", "SERVICE_CHARGE", "FURNITURE_REPAIR",
    "EMERGENCY", "OTHER",
  ]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  billingMonth: z.string(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  description: z.string().optional(),
  splitMethod: z.enum(["EQUAL", "ROOM_BASED", "CUSTOM"]).default("EQUAL"),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).default("PENDING"),
  paidByMemberId: z.string().optional(),
  invoiceUrl: z.string().optional(),
  receiptUrl: z.string().optional(),
  attachmentUrl: z.string().optional(),
  customSplits: z.array(billCustomSplitSchema).optional(),
});

export const billPaymentSchema = z.object({
  billId: z.string(),
  memberId: z.string().optional(),
  amount: z.coerce.number().positive(),
  method: z.string().optional(),
  note: z.string().optional(),
});

export const recurringBillSchema = z.object({
  category: billSchema.shape.category,
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  splitMethod: z.enum(["EQUAL", "ROOM_BASED", "CUSTOM"]).default("EQUAL"),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  reminderDays: z.coerce.number().int().min(0).max(14).default(3),
  dueDaysAfter: z.coerce.number().int().min(1).max(30).default(7),
});

export const expenseSchema = z.object({
  categoryId: z.string(),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  date: z.string(),
});

export const mealCostSchema = z.object({
  date: z.string(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  bazarList: z.string().optional(),
  creditShopper: z.boolean().optional(),
});

export const depositSchema = z.object({
  memberId: z.string(),
  amount: z.coerce.number().positive(),
  method: z.enum(["BKASH", "NAGAD", "ROCKET", "UPAY", "BANK_TRANSFER", "CASH"]),
  type: z.enum(["MONTHLY", "SECURITY", "ADVANCE", "REFUND"]).default("MONTHLY"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const roomSchema = z.object({
  number: z.string().min(1),
  floor: z.coerce.number().int().min(0).default(0),
  capacity: z.coerce.number().int().min(1).default(1),
  branchId: z.string().optional(),
});

export const noticeSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(1),
  priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
  isPinned: z.boolean().default(false),
  scheduledAt: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["CLEANING", "BAZAAR", "MAINTENANCE", "OTHER"]).default("OTHER"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export const visitorSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const bazaarItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  estimatedPrice: z.coerce.number().min(0).optional(),
});

export const bazaarTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  shoppingDate: z.string().min(1, "Shopping date is required"),
  expectedBudget: z.coerce.number().min(0, "Budget must be positive"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: z.string().optional(),
  notes: z.string().optional(),
  memberId: z.string().min(1, "Assign a member"),
  assignmentDate: z.string().min(1, "Assignment date is required"),
  expectedCompletionDate: z.string().min(1, "Due date is required"),
  items: z.array(bazaarItemSchema).min(1, "Add at least one item"),
});

export const bazaarSubmissionSchema = z.object({
  actualCost: z.coerce.number().min(0, "Actual cost is required"),
  notes: z.string().optional(),
  missingItems: z.string().optional(),
  itemUpdates: z.string().optional(),
});

export const bazaarReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CORRECTION_REQUESTED"]),
  comment: z.string().optional(),
  rewardPoints: z.coerce.number().int().min(0).optional(),
});

export type BazaarTaskInput = z.infer<typeof bazaarTaskSchema>;
export type BazaarSubmissionInput = z.infer<typeof bazaarSubmissionSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MessInput = z.infer<typeof messSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
