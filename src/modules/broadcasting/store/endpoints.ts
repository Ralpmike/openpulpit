import { api } from "@/store/api";
import type { Broadcast, HoursSummary, ListenGrant, PublicBroadcast, PublishGrant, SyncResponse } from "@/modules/broadcasting/models";
import type { BroadcastDetailsFormValues } from "@/modules/broadcasting/schemas/broadcast";

export const broadcastingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBroadcastHours: build.query<HoursSummary, void>({
      query: () => "/broadcasts/hours",
      providesTags: [{ type: "Broadcast", id: "HOURS" }],
    }),
    createBroadcast: build.mutation<Broadcast, BroadcastDetailsFormValues>({
      query: (body) => ({ url: "/broadcasts", method: "POST", body }),
      invalidatesTags: [{ type: "Broadcast", id: "MINE" }],
    }),
    getPublishToken: build.mutation<PublishGrant, string>({
      query: (broadcastId) => ({ url: `/broadcasts/${broadcastId}/token`, method: "POST" }),
    }),
    syncBroadcast: build.mutation<SyncResponse, string>({
      query: (broadcastId) => ({ url: `/broadcasts/${broadcastId}/sync`, method: "POST" }),
    }),
    endBroadcast: build.mutation<Broadcast, string>({
      query: (broadcastId) => ({ url: `/broadcasts/${broadcastId}/end`, method: "POST" }),
      invalidatesTags: [{ type: "Broadcast", id: "HOURS" }, { type: "Broadcast", id: "MINE" }, "LiveNow", "Recording"],
    }),
    getBroadcast: build.query<PublicBroadcast, string>({
      query: (broadcastId) => `/broadcasts/${broadcastId}`,
      providesTags: (_result, _error, id) => [{ type: "Broadcast", id }],
    }),
    listLiveNow: build.query<PublicBroadcast[], void>({
      query: () => "/live-now",
      providesTags: ["LiveNow"],
    }),
    getListenToken: build.mutation<ListenGrant, string>({
      query: (broadcastId) => ({ url: `/broadcasts/${broadcastId}/listen-token`, method: "POST" }),
    }),
  }),
});

export const {
  useGetBroadcastHoursQuery,
  useCreateBroadcastMutation,
  useGetPublishTokenMutation,
  useGetListenTokenMutation,
  useSyncBroadcastMutation,
  useEndBroadcastMutation,
  useGetBroadcastQuery,
  useListLiveNowQuery,
} = broadcastingApi;
