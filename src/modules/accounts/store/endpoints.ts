import { api } from "@/store/api";
import type { Me } from "@/modules/accounts/models";
import type { PreacherApplicationFormValues } from "@/modules/accounts/schemas/auth";

export interface RoleOptions {
  canChooseRole: boolean;
  application: { id: string; status: "pending" | "approved" | "rejected"; createdAt: string } | null;
}

export const accountsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<Me | null, void>({
      query: () => "/me",
      providesTags: ["Me"],
    }),
    getRoleOptions: build.query<RoleOptions, void>({
      query: () => "/account/role-options",
      providesTags: ["Me"],
    }),
    chooseToPreach: build.mutation<{ role: "preacher" }, void>({
      query: () => ({ url: "/account/role", method: "POST", body: { role: "preacher" } }),
      invalidatesTags: ["Me"],
    }),
    applyToPreach: build.mutation<{ id: string }, PreacherApplicationFormValues>({
      query: (body) => ({ url: "/preacher-applications", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const { useGetMeQuery, useGetRoleOptionsQuery, useChooseToPreachMutation, useApplyToPreachMutation } = accountsApi;
