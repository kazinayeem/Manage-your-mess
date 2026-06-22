import { PrismaClient, PlanTier, UserRole, PlanDurationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLAN_FEATURES } from "../lib/billing/constants";
import { PERMISSIONS } from "../lib/rbac";

const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    slug: "free",
    tier: PlanTier.FREE,
    name: "Free",
    description: "Get started with essential mess management",
    price: 0,
    currency: "BDT",
    durationType: PlanDurationType.MONTHS,
    durationValue: 1,
    maxMembers: 10,
    isDefault: true,
    sortOrder: 0,
    features: [
      PLAN_FEATURES.MEAL_TRACKING,
      PLAN_FEATURES.EXPENSE_TRACKING,
      PLAN_FEATURES.DEPOSIT_TRACKING,
      PLAN_FEATURES.MONTHLY_REPORT,
    ],
    limits: { members: 10, branches: 1, storage_mb: 100, reports: 5, pdf_exports: 0, excel_exports: 0 },
  },
  {
    slug: "pro",
    tier: PlanTier.PRO,
    name: "Pro",
    description: "For growing messes with advanced reporting",
    price: 299,
    currency: "BDT",
    durationType: PlanDurationType.MONTHS,
    durationValue: 1,
    maxMembers: 30,
    isPopular: true,
    sortOrder: 1,
    features: [
      PLAN_FEATURES.MEAL_TRACKING,
      PLAN_FEATURES.EXPENSE_TRACKING,
      PLAN_FEATURES.DEPOSIT_TRACKING,
      PLAN_FEATURES.MONTHLY_REPORT,
      PLAN_FEATURES.ROOM_MANAGEMENT,
      PLAN_FEATURES.NOTICE_BOARD,
      PLAN_FEATURES.PDF_REPORTS,
      PLAN_FEATURES.EXCEL_REPORTS,
      PLAN_FEATURES.EMAIL_NOTIFICATIONS,
    ],
    limits: { members: 30, branches: 2, storage_mb: 500, reports: 50, pdf_exports: 100, excel_exports: 100 },
  },
  {
    slug: "business",
    tier: PlanTier.BUSINESS,
    name: "Business",
    description: "Full-featured plan for professional mess operations",
    price: 799,
    currency: "BDT",
    durationType: PlanDurationType.MONTHS,
    durationValue: 1,
    maxMembers: 100,
    sortOrder: 2,
    features: [
      PLAN_FEATURES.MEAL_TRACKING,
      PLAN_FEATURES.EXPENSE_TRACKING,
      PLAN_FEATURES.DEPOSIT_TRACKING,
      PLAN_FEATURES.MONTHLY_REPORT,
      PLAN_FEATURES.ROOM_MANAGEMENT,
      PLAN_FEATURES.NOTICE_BOARD,
      PLAN_FEATURES.PDF_REPORTS,
      PLAN_FEATURES.EXCEL_REPORTS,
      PLAN_FEATURES.CSV_EXPORT,
      PLAN_FEATURES.EMAIL_NOTIFICATIONS,
      PLAN_FEATURES.AI_ANALYTICS,
      PLAN_FEATURES.BRANCH_MANAGEMENT,
      PLAN_FEATURES.ADVANCED_REPORTS,
      PLAN_FEATURES.AUDIT_LOGS,
    ],
    limits: { members: 100, branches: 10, storage_mb: 2000, reports: -1, pdf_exports: -1, excel_exports: -1 },
  },
  {
    slug: "enterprise",
    tier: PlanTier.ENTERPRISE,
    name: "Enterprise",
    description: "Custom pricing with unlimited features",
    price: 0,
    currency: "BDT",
    durationType: PlanDurationType.YEARS,
    durationValue: 1,
    maxMembers: -1,
    sortOrder: 3,
    features: Object.values(PLAN_FEATURES),
    limits: { members: -1, branches: -1, storage_mb: -1, reports: -1, pdf_exports: -1, excel_exports: -1 },
  },
];

const DEFAULT_PAYMENT_METHODS = [
  { slug: "bkash", name: "bKash", accountName: "MessFlow Pro", accountNumber: "01700000000", accountType: "Personal", sortOrder: 0 },
  { slug: "nagad", name: "Nagad", accountName: "MessFlow Pro", accountNumber: "01800000000", accountType: "Personal", sortOrder: 1 },
  { slug: "rocket", name: "Rocket", accountName: "MessFlow Pro", accountNumber: "01900000000", sortOrder: 2 },
  { slug: "bank-transfer", name: "Bank Transfer", accountName: "MessFlow Pro", instructions: "Send payment to our bank account and upload the receipt.", sortOrder: 3 },
];

async function main() {
  console.log("Seeding database...");

  for (const plan of DEFAULT_PLANS) {
    const toggles: Record<string, boolean> = {};
    for (const f of plan.features) toggles[f] = true;

    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        durationType: plan.durationType,
        durationValue: plan.durationValue,
        maxMembers: plan.maxMembers,
        features: JSON.stringify(plan.features),
        featureToggles: JSON.stringify(toggles),
        limits: JSON.stringify(plan.limits),
        isPopular: plan.isPopular ?? false,
        isDefault: plan.isDefault ?? false,
        sortOrder: plan.sortOrder,
      },
      create: {
        slug: plan.slug,
        tier: plan.tier,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        durationType: plan.durationType,
        durationValue: plan.durationValue,
        maxMembers: plan.maxMembers,
        features: JSON.stringify(plan.features),
        featureToggles: JSON.stringify(toggles),
        limits: JSON.stringify(plan.limits),
        isPopular: plan.isPopular ?? false,
        isDefault: plan.isDefault ?? false,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });
    console.log(`  Plan: ${plan.name}`);
  }

  for (const method of DEFAULT_PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { slug: method.slug },
      update: {},
      create: { ...method, isActive: true },
    });
    console.log(`  Payment method: ${method.name}`);
  }

  const permissionModules = [
    { name: PERMISSIONS.MESS_CREATE, module: "mess" },
    { name: PERMISSIONS.MESS_READ, module: "mess" },
    { name: PERMISSIONS.MEAL_CREATE, module: "meal" },
    { name: PERMISSIONS.EXPENSE_CREATE, module: "expense" },
    { name: PERMISSIONS.DEPOSIT_CREATE, module: "deposit" },
    { name: PERMISSIONS.ADMIN_ACCESS, module: "admin" },
    { name: PERMISSIONS.SUPER_ADMIN, module: "admin" },
  ];

  for (const p of permissionModules) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, description: p.name, module: p.module },
    });
  }

  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@messflow.pro" },
    update: {
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
    create: {
      email: "admin@messflow.pro",
      name: "Super Admin",
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`  Super Admin: ${admin.email} / Admin@123456 → /super-admin`);

  const demoPassword = await bcrypt.hash("Demo@123456", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@messflow.pro" },
    update: {},
    create: {
      email: "demo@messflow.pro",
      name: "Demo Owner",
      passwordHash: demoPassword,
      role: UserRole.MESS_OWNER,
      emailVerified: new Date(),
    },
  });

  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (freePlan) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = await prisma.subscription.upsert({
      where: { id: "seed-demo-subscription" },
      update: {},
      create: {
        id: "seed-demo-subscription",
        userId: demo.id,
        planId: freePlan.id,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    }).catch(async () => {
      return prisma.subscription.create({
        data: {
          userId: demo.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodEnd: periodEnd,
        },
      });
    });

    const mess = await prisma.mess.upsert({
      where: { slug: "green-view-mess" },
      update: {},
      create: {
        name: "Green View Mess",
        slug: "green-view-mess",
        description: "A demo mess for testing MessFlow Pro",
        address: "Mirpur, Dhaka, Bangladesh",
        ownerId: demo.id,
        subscriptionId: sub.id,
      },
    });

    await prisma.member.upsert({
      where: { messId_userId: { messId: mess.id, userId: demo.id } },
      update: {},
      create: {
        messId: mess.id,
        userId: demo.id,
        role: UserRole.MESS_MANAGER,
        status: "ACTIVE",
        fullName: "Demo Owner",
        monthlyDeposit: 3000,
      },
    });

    const categories = ["Rent", "Electricity", "Water", "Gas", "Internet", "Grocery", "Cleaner", "Maintenance", "Emergency", "Other"];
    const existing = await prisma.expenseCategory.count({ where: { messId: mess.id } });
    if (existing === 0) {
      await prisma.expenseCategory.createMany({
        data: categories.map((name) => ({
          messId: mess.id,
          name,
          isDefault: true,
          isMealCost: name === "Grocery",
        })),
      });
    }

    const now = new Date();
    let monthRecord = await prisma.messMonth.findFirst({
      where: { messId: mess.id, status: "ACTIVE" },
    });
    if (!monthRecord) {
      monthRecord = await prisma.messMonth.create({
        data: {
          messId: mess.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          status: "ACTIVE",
        },
      });
    }
    await prisma.mess.update({
      where: { id: mess.id },
      data: { currentMonthId: monthRecord.id, managerId: demo.id },
    });

    console.log(`  Demo mess: ${mess.name} (invite: ${mess.inviteCode})`);
    console.log(`  Demo user: demo@messflow.pro (password: Demo@123456)`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
