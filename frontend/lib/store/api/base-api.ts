import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
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
