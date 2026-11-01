import { api } from "@/store/api";
import type { MyRecording, PublicRecording, RecordingVisibility } from "@/modules/library/models";
import type { RecordingDetailsFormValues } from "@/modules/library/schemas/recording";

export const libraryApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMyRecordings: build.query<MyRecording[], void>({
      query: () => "/me/recordings",
      providesTags: [{ type: "Recording", id: "MINE" }],
    }),
    updateRecording: build.mutation<{ id: string }, { id: string } & RecordingDetailsFormValues>({
      query: ({ id, ...body }) => ({ url: `/recordings/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Recording"],
    }),
    setRecordingHidden: build.mutation<{ visibility: RecordingVisibility }, { id: string; isHidden: boolean }>({
      query: ({ id, isHidden }) => ({ url: `/recordings/${id}/visibility`, method: "POST", body: { isHidden } }),
      invalidatesTags: ["Recording"],
    }),
    deleteRecording: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/recordings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Recording"],
    }),
    listRecentRecordings: build.query<PublicRecording[], void>({
      query: () => "/recordings/recent",
      providesTags: ["Recording"],
    }),
  }),
});

export const {
  useListMyRecordingsQuery,
  useUpdateRecordingMutation,
  useSetRecordingHiddenMutation,
  useDeleteRecordingMutation,
} = libraryApi;
