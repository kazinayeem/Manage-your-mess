import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export const expenseApi = {
  getExpenses: (messId: string, params?: { monthId?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams({ messId });
    if (params?.monthId) q.append("monthId", params.monthId);
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    return apiGet(`/expenses?${q.toString()}`);
  },
  getCategories: (messId?: string) => apiGet(messId ? `/expenses/categories?messId=${messId}` : "/expenses/categories"),
  createExpense: (data: {
    messId: string;
    categoryId: string;
    amount: number;
    description?: string;
    date?: string;
    receiptUrl?: string;
    monthId?: string;
  }) => apiPost("/expenses", data),
  approveExpense: (id: string) => apiPatch(`/expenses/${id}/approve`),
  deleteExpense: (id: string) => apiDelete(`/expenses/${id}`),
};
