import { baseApi } from "./base-api";

export const announcementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserAnnouncements: builder.query<any[], void>({
      query: () => "/announcements",
      providesTags: ["Announcements"],
    }),
    getActiveAnnouncementsForUser: builder.query<any[], void>({
      query: () => "/announcements/active",
      providesTags: ["Announcements"],
    }),
    markAnnouncementRead: builder.mutation<any, { announcementId: string }>({
      query: ({ announcementId }) => ({
        url: `/announcements/${announcementId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Announcements"],
    }),
  }),
});

export const {
  useGetUserAnnouncementsQuery,
  useGetActiveAnnouncementsForUserQuery,
  useMarkAnnouncementReadMutation,
} = announcementApi;
