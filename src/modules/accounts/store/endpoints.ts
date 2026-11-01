import { api } from "@/store/api";
import type { Me, PreacherProfile } from "@/modules/accounts/models";
import type { PreacherProfileFormValues } from "@/modules/accounts/schemas/profile";
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
    getMyProfile: build.query<PreacherProfile | null, void>({
      query: () => "/profile",
      providesTags: [{ type: "Preacher", id: "ME" }],
    }),
    saveMyProfile: build.mutation<PreacherProfile, PreacherProfileFormValues>({
      query: (body) => ({ url: "/profile", method: "PUT", body }),
      invalidatesTags: [{ type: "Preacher", id: "ME" }, "Preacher", "Me"],
    }),
    uploadMyPhoto: build.mutation<{ photoUrl: string }, Blob>({
      query: (photo) => {
        const body = new FormData();
        body.append("photo", photo, "photo.webp");
        return { url: "/profile/photo", method: "POST", body };
      },
      invalidatesTags: [{ type: "Preacher", id: "ME" }, "Preacher"],
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

export const {
  useGetMyProfileQuery,
  useSaveMyProfileMutation,
  useUploadMyPhotoMutation,
  useGetMeQuery, useGetRoleOptionsQuery, useChooseToPreachMutation, useApplyToPreachMutation } = accountsApi;
