import { baseApi } from "./base-api";

export const messApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMesses: builder.query<any[], void>({
      query: () => "/messes",
      providesTags: ["Mess"],
    }),
    getMessDetails: builder.query<any, { messId: string }>({
      query: ({ messId }) => `/messes/${messId}`,
      providesTags: ["Mess"],
    }),
    createMess: builder.mutation<any, any>({
      query: (body) => ({
        url: "/messes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    joinMess: builder.mutation<any, { inviteCode: string }>({
      query: (body) => ({
        url: "/messes/join",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Mess"],
    }),
    switchActiveMess: builder.mutation<any, { messId: string }>({
      query: (body) => ({
        url: "/messes/switch",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    regenerateInviteCode: builder.mutation<any, { messId: string }>({
      query: ({ messId }) => ({
        url: `/messes/${messId}/regenerate-invite`,
        method: "POST",
      }),
      invalidatesTags: ["Mess"],
    }),
    changeManager: builder.mutation<any, { messId: string; memberId: string }>({
      query: ({ messId, memberId }) => ({
        url: `/messes/${messId}/manager`,
        method: "POST",
        body: { memberId },
      }),
      invalidatesTags: ["Mess", "Member"],
    }),
    addMember: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/members?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Member", "Mess"],
    }),
    updateMember: builder.mutation<any, { messId: string; memberId: string; body: any }>({
      query: ({ memberId, body }) => ({
        url: `/members/${memberId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Member", "Mess"],
    }),
    approveMember: builder.mutation<any, { messId: string; memberId: string }>({
      query: ({ memberId }) => ({
        url: `/members/${memberId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Member", "Mess"],
    }),
    rejectMember: builder.mutation<any, { messId: string; memberId: string }>({
      query: ({ memberId }) => ({
        url: `/members/${memberId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["Member", "Mess"],
    }),
    deleteMember: builder.mutation<any, { messId: string; memberId: string }>({
      query: ({ memberId }) => ({
        url: `/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Member", "Mess"],
    }),
    addExpense: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/expenses?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense", "Dashboard"],
    }),
    addMealCost: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/expenses/meal-cost?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense", "Deposit", "Dashboard"],
    }),
    approveExpense: builder.mutation<any, { messId: string; expenseId: string }>({
      query: ({ expenseId }) => ({
        url: `/expenses/${expenseId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Expense", "Dashboard"],
    }),
    addDeposit: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/deposits?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Deposit", "Dashboard"],
    }),
    approveDeposit: builder.mutation<any, { messId: string; depositId: string }>({
      query: ({ depositId }) => ({
        url: `/deposits/${depositId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Deposit", "Dashboard"],
    }),
    addMealEntry: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/meals/entry?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Meal", "Dashboard"],
    }),
  }),
});

export const {
  useGetMyMessesQuery,
  useGetMessDetailsQuery,
  useCreateMessMutation,
  useJoinMessMutation,
  useSwitchActiveMessMutation,
  useRegenerateInviteCodeMutation,
  useChangeManagerMutation,
  useAddMemberMutation,
  useUpdateMemberMutation,
  useApproveMemberMutation,
  useRejectMemberMutation,
  useDeleteMemberMutation,
  useAddExpenseMutation,
  useAddMealCostMutation,
  useApproveExpenseMutation,
  useAddDepositMutation,
  useApproveDepositMutation,
  useAddMealEntryMutation,
} = messApi;
