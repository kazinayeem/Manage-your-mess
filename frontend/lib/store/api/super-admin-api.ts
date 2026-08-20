import { baseApi } from "./base-api";

export const superAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuperAdminOverview: builder.query<any, void>({
      query: () => "/super-admin/overview",
      providesTags: ["Dashboard"],
    }),
    getAdminUsers: builder.query<any, { page?: number; search?: string; role?: string } | void>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const search = arg?.search ?? "";
        const role = arg?.role ?? "";
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (role) params.set("role", role);
        return `/super-admin/users?${params.toString()}`;
      },
      providesTags: ["User"],
    }),
    updateUserRole: builder.mutation<any, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/super-admin/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["User", "Dashboard"],
    }),
    updateUserStatus: builder.mutation<any, { userId: string; isActive?: boolean; isLocked?: boolean }>({
      query: ({ userId, isActive, isLocked }) => ({
        url: `/super-admin/users/${userId}/status`,
        method: "PATCH",
        body: { isActive, isLocked },
      }),
      invalidatesTags: ["User", "Dashboard"],
    }),
    getAdminMesses: builder.query<any, { page?: number; search?: string; status?: string } | void>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const search = arg?.search ?? "";
        const status = arg?.status ?? "";
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        return `/super-admin/messes?${params.toString()}`;
      },
      providesTags: ["Mess"],
    }),
    approveMess: builder.mutation<any, string>({
      query: (messId) => ({
        url: `/super-admin/messes/${messId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    rejectMess: builder.mutation<any, { messId: string; reason?: string }>({
      query: ({ messId, reason }) => ({
        url: `/super-admin/messes/${messId}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    suspendMess: builder.mutation<any, string>({
      query: (messId) => ({
        url: `/super-admin/messes/${messId}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    activateMess: builder.mutation<any, string>({
      query: (messId) => ({
        url: `/super-admin/messes/${messId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Mess", "Dashboard"],
    }),
    getAdminPayments: builder.query<any, { page?: number; status?: string } | void>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const status = arg?.status ?? "";
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set("status", status);
        return `/super-admin/payments?${params.toString()}`;
      },
      providesTags: ["Payment"],
    }),
    approvePayment: builder.mutation<any, string>({
      query: (paymentId) => ({
        url: `/super-admin/payments/${paymentId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Payment", "Subscription", "Dashboard"],
    }),
    rejectPayment: builder.mutation<any, { paymentId: string; reason?: string }>({
      query: ({ paymentId, reason }) => ({
        url: `/super-admin/payments/${paymentId}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Payment", "Dashboard"],
    }),
    getPaymentMethods: builder.query<any, void>({
      query: () => "/super-admin/payment-methods",
    }),
    getAdminSubscriptions: builder.query<any, { page?: number; status?: string } | void>({
      query: (arg) => {
        const page = arg?.page ?? 1;
        const status = arg?.status ?? "";
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set("status", status);
        return `/super-admin/subscriptions?${params.toString()}`;
      },
      providesTags: ["Subscription"],
    }),
    getAdminPlans: builder.query<any, void>({
      query: () => "/super-admin/plans",
      providesTags: ["Subscription"],
    }),
    getAdminCoupons: builder.query<any, void>({
      query: () => "/super-admin/coupons",
    }),
    getAdminReferrals: builder.query<any, void>({
      query: () => "/super-admin/referrals",
    }),
    getAdminSupportTickets: builder.query<any, void>({
      query: () => "/super-admin/support",
      providesTags: ["Support"],
    }),
    getAdminAnnouncements: builder.query<any, void>({
      query: () => "/super-admin/announcements",
    }),
    getAdminAnalytics: builder.query<any, { period?: string } | void>({
      query: (arg) => `/super-admin/analytics?period=${arg?.period || "month"}`,
      providesTags: ["Analytics"],
    }),
    getAdminAuditLogs: builder.query<any, void>({
      query: () => "/super-admin/audit-logs",
      providesTags: ["Audit"],
    }),
    getSystemSettings: builder.query<any, void>({
      query: () => "/super-admin/settings",
    }),
    getDatabaseStats: builder.query<any, void>({
      query: () => "/super-admin/database",
    }),
    getFeatureFlags: builder.query<any, void>({
      query: () => "/super-admin/feature-flags",
    }),
    getBackupStatus: builder.query<any, void>({
      query: () => "/super-admin/backups",
    }),
    getApiOverview: builder.query<any, void>({
      query: () => "/super-admin/api-overview",
    }),
    getEmailTemplates: builder.query<any, void>({
      query: () => "/super-admin/email-templates",
    }),
    getNotificationTemplates: builder.query<any, void>({
      query: () => "/super-admin/notification-templates",
    }),
    getSecurityOverview: builder.query<any, void>({
      query: () => "/super-admin/security",
    }),
  }),
});

export const {
  useGetSuperAdminOverviewQuery,
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useGetAdminMessesQuery,
  useApproveMessMutation,
  useRejectMessMutation,
  useSuspendMessMutation,
  useActivateMessMutation,
  useGetAdminPaymentsQuery,
  useApprovePaymentMutation,
  useRejectPaymentMutation,
  useGetPaymentMethodsQuery,
  useGetAdminSubscriptionsQuery,
  useGetAdminPlansQuery,
  useGetAdminCouponsQuery,
  useGetAdminReferralsQuery,
  useGetAdminSupportTicketsQuery,
  useGetAdminAnnouncementsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminAuditLogsQuery,
  useGetSystemSettingsQuery,
  useGetDatabaseStatsQuery,
  useGetFeatureFlagsQuery,
  useGetBackupStatusQuery,
  useGetApiOverviewQuery,
  useGetEmailTemplatesQuery,
  useGetNotificationTemplatesQuery,
  useGetSecurityOverviewQuery,
} = superAdminApi;
