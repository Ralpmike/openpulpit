import { api } from "@/store/api";
import type { FollowedPreacher, FollowState } from "@/modules/social/models";

export const socialApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFollowState: build.query<FollowState, string>({
      query: (slug) => `/preachers/${slug}/follow`,
      providesTags: (_result, _error, slug) => [{ type: "Follow", id: slug }],
    }),
    setFollowing: build.mutation<FollowState, { slug: string; isFollowing: boolean }>({
      query: ({ slug, isFollowing }) => ({ url: `/preachers/${slug}/follow`, method: isFollowing ? "PUT" : "DELETE" }),
      // Optimistic: the button flips at once and flips back if the request fails.
      async onQueryStarted({ slug, isFollowing }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          socialApi.util.updateQueryData("getFollowState", slug, (draft) => {
            if (draft.isFollowing === isFollowing) return;
            draft.isFollowing = isFollowing;
            draft.notificationsEnabled = isFollowing;
            draft.followerCount += isFollowing ? 1 : -1;
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(socialApi.util.upsertQueryData("getFollowState", slug, data));
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: "Follow", id: "LIST" }, "Preacher"],
    }),
    listFollowing: build.query<FollowedPreacher[], void>({
      query: () => "/me/following",
      providesTags: [{ type: "Follow", id: "LIST" }],
    }),
  }),
});

export const { useGetFollowStateQuery, useSetFollowingMutation, useListFollowingQuery } = socialApi;
