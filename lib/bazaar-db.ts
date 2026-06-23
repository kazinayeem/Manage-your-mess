import { Prisma } from "@prisma/client";

export function isMissingBazaarTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export const EMPTY_BAZAAR_ANALYTICS = {
  totalCost: 0,
  totalBudget: 0,
  monthlyCost: 0,
  avgCost: 0,
  taskCount: 0,
  memberWise: [] as Array<{
    memberId: string;
    name: string;
    cost: number;
    count: number;
  }>,
  mostActiveShopper: null as {
    memberId: string;
    name: string;
    cost: number;
    count: number;
  } | null,
  monthlyTrend: [] as Array<{ month: string; budget: number; actual: number }>,
  budgetVariance: 0,
};
