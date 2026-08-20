export function isMissingBazaarTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as any).code === "P2021"
  );
}

export const EMPTY_BAZAAR_ANALYTICS = {
  totalCost: 0,
  totalBudget: 0,
  monthlyCost: 0,
  avgCost: 0,
  taskCount: 0,
  memberWise: [] as { memberId: string; name: string; cost: number; count: number }[],
  mostActiveShopper: null,
  monthlyTrend: [] as { month: string; budget: number; actual: number }[],
  budgetVariance: 0,
};
