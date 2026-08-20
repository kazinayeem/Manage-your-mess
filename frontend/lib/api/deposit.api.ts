import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export const depositApi = {
  getDeposits: (messId: string, params?: { monthId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams({ messId });
    if (params?.monthId) q.append("monthId", params.monthId);
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    return apiGet(`/deposits?${q.toString()}`);
  },
  createDeposit: (data: {
    messId: string;
    memberId: string;
    amount: number;
    method: string;
    type?: string;
    reference?: string;
    notes?: string;
    monthId?: string;
  }) => apiPost("/deposits", data),
  updateDeposit: (id: string, data: any) => apiPatch(`/deposits/${id}`, data),
  deleteDeposit: (id: string) => apiDelete(`/deposits/${id}`),
};
