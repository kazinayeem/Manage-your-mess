import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";

export const memberApi = {
  getMembers: (messId: string) => apiGet(`/members?messId=${messId}`),
  getMemberById: (memberId: string) => apiGet(`/members/${memberId}`),
  updateMember: (memberId: string, data: any) => apiPatch(`/members/${memberId}`, data),
  updateMemberStatus: (memberId: string, data: { status?: string; role?: string }) =>
    apiPatch(`/members/${memberId}/status`, data),
  removeMember: (memberId: string) => apiDelete(`/members/${memberId}`),
};
