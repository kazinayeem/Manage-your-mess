import { baseApi } from "./base-api";
import { getUserNotifications } from "@/actions/notifications";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<
      Awaited<ReturnType<typeof getUserNotifications>>,
      { limit?: number }
    >({
      query: ({ limit = 20 } = {}) => `/notifications?limit=${limit}`,
      providesTags: ["Notification"],
    }),
  }),
});

export const { useNotificationsQuery } = notificationApi;
