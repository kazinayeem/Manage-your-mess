import { apiGet } from "@/lib/api-client";

export const reportApi = {
  getReportMonths: (messId: string) => apiGet(`/reports/months?messId=${messId}`),
  getReportData: (messId: string, monthId: string, reportType = "monthly", locale = "en") =>
    apiGet(`/reports/data?messId=${messId}&monthId=${monthId}&reportType=${reportType}&locale=${locale}`),
};
