import { api } from "@/store/api";
import type { Broadcast, HoursSummary, ListenGrant, PublishGrant } from "@/modules/broadcasting/models";
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
} = broadcastingApi;
