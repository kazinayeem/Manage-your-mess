import { baseApi } from "./base-api";

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessMonthsForReports: builder.query<any[], { messId: string }>({
      query: ({ messId }) => `/reports/months?messId=${messId}`,
      providesTags: ["Report"],
    }),
    fetchReportData: builder.query<any, { messId: string; monthId: string; reportType: string; locale?: string }>({
      query: ({ messId, monthId, reportType, locale }) =>
        `/reports/data?messId=${messId}&monthId=${monthId}&reportType=${reportType}${locale ? `&locale=${locale}` : ""}`,
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetMessMonthsForReportsQuery, useFetchReportDataQuery } = reportsApi;
