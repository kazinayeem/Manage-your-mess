import { apiGet, apiPost, apiPatch } from "@/lib/api-client";

export const monthApi = {
  getMonths: (messId: string) => apiGet(`/months/mess/${messId}`),
  getActiveMonth: (messId: string) => apiGet(`/months/mess/${messId}/active`),
  getMonthSummary: (monthId: string) => apiGet(`/months/${monthId}/summary`),
  startNewMonth: (messId: string, data?: { label?: string }) =>
    apiPost(`/months/mess/${messId}`, data),
  closeMonth: (monthId: string) => apiPatch(`/months/${monthId}/close`),
};
