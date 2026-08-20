import { apiGet, apiPost } from "@/lib/api-client";

export const mealApi = {
  getMeals: (messId: string, params?: { date?: string; monthId?: string }) => {
    const q = new URLSearchParams({ messId });
    if (params?.date) q.append("date", params.date);
    if (params?.monthId) q.append("monthId", params.monthId);
    return apiGet(`/meals?${q.toString()}`);
  },
  getTodayMeal: (messId: string) => apiGet(`/meals/today?messId=${messId}`),
  addBulkMealEntries: (messId: string, data: { date: string; entries: any[]; monthId?: string }) =>
    apiPost("/meals", { messId, ...data }),
};
