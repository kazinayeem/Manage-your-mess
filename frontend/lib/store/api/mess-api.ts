import { baseApi } from "./base-api";
import { getDashboardStats } from "@/actions/dashboard";

export const messApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboardStats: builder.query<
      Awaited<ReturnType<typeof getDashboardStats>>,
      { messId: string }
    >({
      async queryFn({ messId }) {
        try {
          const data = await getDashboardStats(messId);
          return { data };
        } catch (e) {
          return { error: { status: 500, data: e instanceof Error ? e.message : "Failed" } };
        }
      },
      providesTags: (_r, _e, { messId }) => [{ type: "Dashboard", id: messId }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useDashboardStatsQuery } = messApi;
