import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1`,
    prepareHeaders: async (headers) => {
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.accessToken) {
          headers.set("Authorization", `Bearer ${session.accessToken}`);
        }
      } catch (e) {
        console.error("Error setting auth header in baseApi:", e);
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
