import { api } from "@/store/api";
import type { ReportFormValues } from "@/modules/moderation/schemas/report";

export const moderationApi = api.injectEndpoints({
  endpoints: (build) => ({
    createReport: build.mutation<{ id: string }, ReportFormValues>({
      query: (body) => ({ url: "/reports", method: "POST", body }),
      invalidatesTags: ["AdminQueue"],
    }),
  }),
});

export const { useCreateReportMutation } = moderationApi;
