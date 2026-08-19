import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1`,
    // Send the httpOnly session cookie automatically on every request.
    // Express reads it via req.cookies["bornomess.session"] in its auth middleware.
    credentials: "include",
    prepareHeaders: (headers) => {
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
