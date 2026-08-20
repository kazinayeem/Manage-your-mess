import { apiGet, apiPost } from "@/lib/api-client";

export const bazaarApi = {
  getBazaarTasks: (messId: string) => apiGet(`/bazaar?messId=${messId}`),
  createBazaarTask: (data: {
    messId: string;
    title: string;
    shoppingDate: string;
    expectedBudget?: number;
    priority?: string;
    description?: string;
    notes?: string;
    memberIds?: string[];
    items?: any[];
  }) => apiPost("/bazaar", data),
  submitBazaar: (taskId: string, data: {
    totalAmount: number;
    notes?: string;
    paymentSource?: "PERSONAL" | "MESS_BALANCE";
    paidByMemberId?: string;
    items?: any[];
  }) => apiPost(`/bazaar/${taskId}/submit`, data),
  approveBazaar: (taskId: string, data?: { comment?: string }) =>
    apiPost(`/bazaar/${taskId}/approve`, data),
  rejectBazaar: (taskId: string, data?: { comment?: string }) =>
    apiPost(`/bazaar/${taskId}/reject`, data),
};
