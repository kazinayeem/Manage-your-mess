import { baseApi } from "./base-api";
import { getDashboardStats } from "@/actions/dashboard";

export const messApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboardStats: builder.query<
      Awaited<ReturnType<typeof getDashboardStats>>,
      { messId: string }
    >({
      query: ({ messId }) => `/analytics/dashboard?messId=${messId}`,
      providesTags: (_r, _e, { messId }) => [{ type: "Dashboard", id: messId }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useDashboardStatsQuery } = messApi;
