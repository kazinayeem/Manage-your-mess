import { baseApi } from "./base-api";

export type AnalyticsRange =
  | "today"
  | "week"
  | "month"
  | "last_month"
  | "3months"
  | "6months"
  | "year"
  | "custom";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    superAdminAnalytics: builder.query<any, { range?: AnalyticsRange }>({
      query: ({ range = "year" }) => `/super-admin/overview?range=${range}`,
      providesTags: [{ type: "Analytics", id: "SUPER_ADMIN" }],
    }),
    messAnalytics: builder.query<any, { messId: string; range?: AnalyticsRange }>({
      query: ({ messId, range = "6months" }) => `/analytics/dashboard?messId=${messId}&range=${range}`,
      providesTags: (_r, _e, { messId }) => [{ type: "Analytics", id: `MESS_${messId}` }],
    }),
    memberAnalytics: builder.query<any, { messId: string }>({
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
