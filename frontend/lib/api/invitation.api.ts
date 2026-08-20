import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

export const invitationApi = {
  createInvitation: (messId: string, data: { email: string; role?: string }) =>
    apiPost(`/invitations/mess/${messId}`, data),
  getMessInvitations: (messId: string) => apiGet(`/invitations/mess/${messId}`),
  cancelInvitation: (id: string) => apiDelete(`/invitations/${id}`),
  getInvitationByToken: (token: string) => apiGet(`/invitations/token/${token}`),
  acceptInvitation: (token: string) => apiPost(`/invitations/token/${token}/accept`),
  rejectInvitation: (token: string) => apiPost(`/invitations/token/${token}/reject`),
};
