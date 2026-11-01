import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/helpers/api/baseQuery";

export const TAG_TYPES = [
  "Me",
  "Preacher",
  "Broadcast",
  "LiveNow",
  "Recording",
  "Follow",
  "NotificationSetting",
  "Report",
  "AdminQueue",
  "Stats",
] as const;

/**
 * The ONE RTK Query api slice. Modules add endpoints with
 * `api.injectEndpoints` in `src/modules/<module>/store/endpoints.ts`.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAG_TYPES,
  keepUnusedDataFor: 120,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
