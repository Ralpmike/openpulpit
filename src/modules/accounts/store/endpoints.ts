import { api } from "@/store/api";
import type { Me } from "@/modules/accounts/models";

export const accountsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<Me | null, void>({
      query: () => "/me",
      providesTags: ["Me"],
    }),
  }),
});

export const { useGetMeQuery } = accountsApi;
