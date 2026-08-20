import { baseApi } from "./base-api";

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivePlans: builder.query<any, void>({
      query: () => "/billing/plans",
      providesTags: ["Subscription"],
    }),
    getPaymentMethods: builder.query<any, void>({
      query: () => "/billing/payment-methods",
      providesTags: ["Payment"],
    }),
    submitSubscriptionRequest: builder.mutation<any, any>({
      query: (body) => ({
        url: "/billing/subscription-request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription", "Payment"],
    }),
    getMyPaymentRequests: builder.query<any, void>({
      query: () => "/billing/my-payment-requests",
      providesTags: ["Payment"],
    }),
    getUserSubscription: builder.query<any, { userId?: string }>({
      query: (arg) => `/billing/subscription${arg?.userId ? `?userId=${arg.userId}` : ""}`,
      providesTags: ["Subscription"],
    }),
  }),
});

export const {
  useGetActivePlansQuery,
  useGetPaymentMethodsQuery,
  useSubmitSubscriptionRequestMutation,
  useGetMyPaymentRequestsQuery,
  useGetUserSubscriptionQuery,
} = billingApi;
