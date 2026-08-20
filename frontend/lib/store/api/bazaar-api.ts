import { baseApi } from "./base-api";

export const bazaarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBazaarTasks: builder.query<any, { messId: string; filter?: string }>({
      query: ({ messId, filter }) => `/bazaar?messId=${messId}${filter ? `&filter=${filter}` : ""}`,
      providesTags: ["Bazaar"],
    }),
    getBazaarTask: builder.query<any, { messId: string; taskId: string }>({
      query: ({ messId, taskId }) => `/bazaar/task/${taskId}?messId=${messId}`,
      providesTags: ["Bazaar"],
    }),
    getMyPendingBazaars: builder.query<any, { messId: string; memberId: string }>({
      query: ({ messId, memberId }) => `/bazaar/my?messId=${messId}&memberId=${memberId}`,
      providesTags: ["Bazaar"],
    }),
    getBazaarAnalytics: builder.query<any, { messId: string }>({
      query: ({ messId }) => `/bazaar/analytics?messId=${messId}`,
      providesTags: ["Bazaar"],
    }),
    getBazaarHistory: builder.query<any, { messId: string }>({
      query: ({ messId }) => `/bazaar/history?messId=${messId}`,
      providesTags: ["Bazaar"],
    }),
    createBazaarTask: builder.mutation<any, { messId: string; formData: FormData | any }>({
      query: ({ messId, formData }) => ({
        url: `/bazaar?messId=${messId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Bazaar", "Dashboard"],
    }),
    submitBazaarTask: builder.mutation<any, { messId: string; taskId: string; formData: FormData | any }>({
      query: ({ messId, taskId, formData }) => ({
        url: `/bazaar/${taskId}/submit?messId=${messId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Bazaar", "Dashboard"],
    }),
    reviewBazaarTask: builder.mutation<any, { messId: string; taskId: string; formData: FormData | any }>({
      query: ({ messId, taskId, formData }) => ({
        url: `/bazaar/${taskId}/review?messId=${messId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Bazaar", "Dashboard", "Expense"],
    }),
    markBazaarInProgress: builder.mutation<any, { messId: string; taskId: string }>({
      query: ({ messId, taskId }) => ({
        url: `/bazaar/${taskId}/in-progress?messId=${messId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Bazaar"],
    }),
  }),
});

export const {
  useGetBazaarTasksQuery,
  useGetBazaarTaskQuery,
  useGetMyPendingBazaarsQuery,
  useGetBazaarAnalyticsQuery,
  useGetBazaarHistoryQuery,
  useCreateBazaarTaskMutation,
  useSubmitBazaarTaskMutation,
  useReviewBazaarTaskMutation,
  useMarkBazaarInProgressMutation,
} = bazaarApi;
