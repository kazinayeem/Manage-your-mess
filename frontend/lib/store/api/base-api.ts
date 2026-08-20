import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/token-storage";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1`,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "User",
    "Mess",
    "Member",
    "Meal",
    "Expense",
    "Deposit",
    "Report",
    "Subscription",
    "Payment",
    "Notification",
    "Analytics",
    "Audit",
    "Support",
    "Dashboard",
  ],
  endpoints: () => ({}),
});
