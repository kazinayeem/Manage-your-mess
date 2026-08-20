import { baseApi } from "./base-api";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUserLocale: builder.mutation<any, { locale: string }>({
      query: (body) => ({
        url: "/users/locale",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    registerUser: builder.mutation<any, any>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const { useUpdateUserLocaleMutation, useRegisterUserMutation } = userApi;
