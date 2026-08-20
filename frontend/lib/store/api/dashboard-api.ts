import { baseApi } from "./base-api";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<any, { messId: string }>({
      query: ({ messId }) => `/analytics/dashboard?messId=${messId}`,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
