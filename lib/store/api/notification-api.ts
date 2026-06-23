import { baseApi } from "./base-api";
import { getUserNotifications } from "@/actions/notifications";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<
      Awaited<ReturnType<typeof getUserNotifications>>,
      { limit?: number }
    >({
      async queryFn() {
        try {
          const data = await getUserNotifications();
          return { data };
        } catch (e) {
          return { error: { status: 500, data: e instanceof Error ? e.message : "Failed" } };
        }
      },
      providesTags: ["Notification"],
    }),
  }),
});

export const { useNotificationsQuery } = notificationApi;
