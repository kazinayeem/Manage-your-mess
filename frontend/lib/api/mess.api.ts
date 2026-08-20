import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export const messApi = {
  getMyMesses: () => apiGet("/messes"),
  getMessDetails: (messId: string) => apiGet(`/messes/${messId}`),
  createMess: (data: { name: string; description?: string; address?: string; monthlyRules?: any }) =>
    apiPost("/messes", data),
  updateMess: (messId: string, data: any) => apiPatch(`/messes/${messId}`, data),
  deleteMess: (messId: string) => apiDelete(`/messes/${messId}`),
  switchActiveMess: (messId: string) => apiPost("/messes/switch", { messId }),
  regenerateInviteCode: (messId: string) => apiPost(`/messes/${messId}/regenerate-invite`),
  changeManager: (messId: string, memberId: string) =>
    apiPatch(`/messes/${messId}/manager`, { memberId }),
  joinMess: (inviteCode: string) => apiPost("/messes/join", { inviteCode }),
};
