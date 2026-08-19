import { baseApi } from "./base-api";
import {
  getSuperAdminAnalytics,
  getMessAnalytics,
  getMemberAnalytics,
} from "@/actions/analytics";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    superAdminAnalytics: builder.query<
      Awaited<ReturnType<typeof getSuperAdminAnalytics>>,
      { range?: string }
    >({
      query: ({ range = "year" }) => `/super-admin/overview?range=${range}`,
      providesTags: [{ type: "Analytics", id: "SUPER_ADMIN" }],
    }),
    messAnalytics: builder.query<
      Awaited<ReturnType<typeof getMessAnalytics>>,
      { messId: string; range?: string }
    >({
      query: ({ messId, range = "6months" }) => `/analytics/dashboard?messId=${messId}&range=${range}`,
      providesTags: (_r, _e, { messId }) => [{ type: "Analytics", id: `MESS_${messId}` }],
    }),
    memberAnalytics: builder.query<
      Awaited<ReturnType<typeof getMemberAnalytics>>,
      { messId: string }
    >({
      query: ({ messId }) => `/analytics/dashboard?messId=${messId}`,
      providesTags: (_r, _e, { messId }) => [{ type: "Analytics", id: `MEMBER_${messId}` }],
    }),
  }),
});

export const {
  useSuperAdminAnalyticsQuery,
  useMessAnalyticsQuery,
  useMemberAnalyticsQuery,
} = analyticsApi;
