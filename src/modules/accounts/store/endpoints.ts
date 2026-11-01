import { api } from "@/store/api";
import type { Me, PreacherProfile } from "@/modules/accounts/models";
import type { PreacherProfileFormValues } from "@/modules/accounts/schemas/profile";
import type { PreacherApplicationFormValues, VerificationRequestFormValues } from "@/modules/accounts/schemas/auth";

export interface VerificationState {
  status: "none" | "pending" | "verified" | "rejected";
  decisionNote: string;
}

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
    getVerification: build.query<VerificationState, void>({
      query: () => "/verification",
      providesTags: [{ type: "Preacher", id: "VERIFICATION" }],
    }),
    requestVerification: build.mutation<{ id: string }, VerificationRequestFormValues>({
      query: (body) => ({ url: "/verification", method: "POST", body }),
      invalidatesTags: [{ type: "Preacher", id: "VERIFICATION" }],
    }),
    updateMyName: build.mutation<{ name: string }, { name: string }>({
      query: (body) => ({ url: "/account", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
    uploadAccountPhoto: build.mutation<{ photoUrl: string | null }, Blob>({
      query: (photo) => {
        const body = new FormData();
        body.append("photo", photo, "photo.webp");
        return { url: "/account/photo", method: "POST", body };
      },
      invalidatesTags: ["Me"],
    }),
    removeAccountPhoto: build.mutation<{ photoUrl: null }, void>({
      query: () => ({ url: "/account/photo", method: "DELETE" }),
      invalidatesTags: ["Me"],
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
  useGetVerificationQuery,
  useUpdateMyNameMutation,
  useUploadAccountPhotoMutation,
  useRemoveAccountPhotoMutation,
  useRequestVerificationMutation,
  useGetMeQuery, useGetRoleOptionsQuery, useChooseToPreachMutation, useApplyToPreachMutation } = accountsApi;
