import { baseApi } from "./base-api";
import {
  getSuperAdminAnalytics,
  getMessAnalytics,
  getMemberAnalytics,
  type AnalyticsRange,
} from "@/actions/analytics";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    superAdminAnalytics: builder.query<
      Awaited<ReturnType<typeof getSuperAdminAnalytics>>,
      { range?: AnalyticsRange }
    >({
      async queryFn({ range = "year" }) {
        try {
          const data = await getSuperAdminAnalytics(range);
          return { data };
        } catch (e) {
          return { error: { status: 500, data: e instanceof Error ? e.message : "Failed" } };
        }
      },
      providesTags: [{ type: "Analytics", id: "SUPER_ADMIN" }],
    }),
    messAnalytics: builder.query<
      Awaited<ReturnType<typeof getMessAnalytics>>,
      { messId: string; range?: AnalyticsRange }
    >({
      async queryFn({ messId, range = "6months" }) {
        try {
          const data = await getMessAnalytics(messId, range);
          return { data };
        } catch (e) {
          return { error: { status: 500, data: e instanceof Error ? e.message : "Failed" } };
        }
      },
      providesTags: (_r, _e, { messId }) => [{ type: "Analytics", id: `MESS_${messId}` }],
    }),
    memberAnalytics: builder.query<
      Awaited<ReturnType<typeof getMemberAnalytics>>,
      { messId: string }
    >({
      async queryFn({ messId }) {
        try {
          const data = await getMemberAnalytics(messId);
          return { data };
        } catch (e) {
          return { error: { status: 500, data: e instanceof Error ? e.message : "Failed" } };
        }
      },
      providesTags: (_r, _e, { messId }) => [{ type: "Analytics", id: `MEMBER_${messId}` }],
    }),
  }),
});

export const {
  useSuperAdminAnalyticsQuery,
  useMessAnalyticsQuery,
  useMemberAnalyticsQuery,
} = analyticsApi;
