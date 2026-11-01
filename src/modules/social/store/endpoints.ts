import { api } from "@/store/api";
import type { FollowedPreacher, FollowState } from "@/modules/social/models";

export interface FollowerSummary {
  id: string;
  name: string;
  image: string | null;
  followedAt: string;
}

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
    setFollowNotifications: build.mutation<FollowState, { slug: string; notificationsEnabled: boolean }>({
      query: ({ slug, notificationsEnabled }) => ({ url: `/preachers/${slug}/follow`, method: "PATCH", body: { notificationsEnabled } }),
      async onQueryStarted({ slug, notificationsEnabled }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(socialApi.util.updateQueryData("getFollowState", slug, (draft) => void (draft.notificationsEnabled = notificationsEnabled))),
          dispatch(
            socialApi.util.updateQueryData("listFollowing", undefined, (draft) => {
              const preacher = draft.find((item) => item.slug === slug);
              if (preacher) preacher.notificationsEnabled = notificationsEnabled;
            }),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),
    listMyFollowers: build.query<{ followers: FollowerSummary[]; blocked: FollowerSummary[] }, void>({
      query: () => "/me/followers",
      providesTags: [{ type: "Follow", id: "FOLLOWERS" }],
    }),
    setBlocked: build.mutation<{ isBlocked: boolean }, { listenerId: string; isBlocked: boolean }>({
      query: ({ listenerId, isBlocked }) => ({ url: `/blocks/${listenerId}`, method: isBlocked ? "PUT" : "DELETE" }),
      invalidatesTags: [{ type: "Follow", id: "FOLLOWERS" }],
    }),
    listFollowing: build.query<FollowedPreacher[], void>({
      query: () => "/me/following",
      providesTags: [{ type: "Follow", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFollowStateQuery,
  useSetFollowingMutation,
  useListFollowingQuery,
  useSetFollowNotificationsMutation,
  useListMyFollowersQuery,
  useSetBlockedMutation,
} = socialApi;
