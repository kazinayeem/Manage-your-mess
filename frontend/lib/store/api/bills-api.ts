import { baseApi } from "./base-api";

export const billsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessBills: builder.query<any, { messId: string; monthId?: string; category?: string; year?: number }>({
      query: ({ messId, monthId, category, year }) => {
        let params = `?messId=${messId}`;
        if (monthId) params += `&monthId=${monthId}`;
        if (category) params += `&category=${category}`;
        if (year) params += `&year=${year}`;
        return `/bills${params}`;
      },
      providesTags: ["Bills"],
    }),
    getBill: builder.query<any, { messId: string; billId: string }>({
      query: ({ messId, billId }) => `/bills/${billId}?messId=${messId}`,
      providesTags: ["Bills"],
    }),
    addBill: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/bills?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bills", "Dashboard"],
    }),
    recordBillPayment: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/bills/payment?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bills", "Dashboard"],
    }),
    deleteBill: builder.mutation<any, { messId: string; billId: string }>({
      query: ({ messId, billId }) => ({
        url: `/bills/${billId}?messId=${messId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bills", "Dashboard"],
    }),
    getRecurringBills: builder.query<any, { messId: string }>({
      query: ({ messId }) => `/bills/recurring?messId=${messId}`,
      providesTags: ["Bills"],
    }),
    addRecurringBill: builder.mutation<any, { messId: string; body: any }>({
      query: ({ messId, body }) => ({
        url: `/bills/recurring?messId=${messId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bills"],
    }),
    generateRecurringBills: builder.mutation<any, { messId: string }>({
      query: ({ messId }) => ({
        url: `/bills/recurring/generate?messId=${messId}`,
        method: "POST",
      }),
      invalidatesTags: ["Bills", "Dashboard"],
    }),
    getBillKpis: builder.query<any, { messId: string; monthId?: string }>({
      query: ({ messId, monthId }) => `/bills/kpis?messId=${messId}${monthId ? `&monthId=${monthId}` : ""}`,
      providesTags: ["Bills"],
    }),
  }),
});

export const {
  useGetMessBillsQuery,
  useGetBillQuery,
  useAddBillMutation,
  useRecordBillPaymentMutation,
  useDeleteBillMutation,
  useGetRecurringBillsQuery,
  useAddRecurringBillMutation,
  useGenerateRecurringBillsMutation,
  useGetBillKpisQuery,
} = billsApi;
