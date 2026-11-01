import { api } from "@/store/api";
import type { AdminActionInput } from "@/modules/admin/schemas/actions";
import type { AuditRow, ReportGroup } from "@/modules/admin/models";

export interface PendingApplication {
  id: string;
  user_id: string;
  ministry: string;
  note: string;
  created_at: string;
  name: string;
  email: string;
}

export interface PendingVerification {
  id: string;
  preacher_id: string;
  message: string;
  created_at: string;
  display_name: string;
  slug: string;
  ministry: string;
  city: string;
  state: string;
}

type Decision = { id: string; decision: "approve" | "reject"; reason: string };

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    listReportGroups: build.query<ReportGroup[], void>({ query: () => "/admin/reports", providesTags: ["AdminQueue"] }),
    runAdminAction: build.mutation<{ changed: boolean }, AdminActionInput>({
      query: (body) => ({ url: "/admin/actions", method: "POST", body }),
      invalidatesTags: ["AdminQueue", "LiveNow", "Recording", "Preacher"],
    }),
    listAuditLog: build.query<AuditRow[], void>({ query: () => "/admin/audit", providesTags: ["AdminQueue"] }),
    listPendingApplications: build.query<PendingApplication[], void>({ query: () => "/admin/preacher-applications", providesTags: ["AdminQueue"] }),
    decideApplication: build.mutation<{ id: string }, Decision>({
      query: ({ id, ...body }) => ({ url: `/admin/preacher-applications/${id}`, method: "POST", body }),
      invalidatesTags: ["AdminQueue"],
    }),
    listPendingVerifications: build.query<PendingVerification[], void>({ query: () => "/admin/verification-requests", providesTags: ["AdminQueue"] }),
    decideVerification: build.mutation<{ id: string }, Decision>({
      query: ({ id, ...body }) => ({ url: `/admin/verification-requests/${id}`, method: "POST", body }),
      invalidatesTags: ["AdminQueue", "Preacher"],
    }),
  }),
});

export const {
  useListReportGroupsQuery,
  useRunAdminActionMutation,
  useListAuditLogQuery,
  useListPendingApplicationsQuery,
  useDecideApplicationMutation,
  useListPendingVerificationsQuery,
  useDecideVerificationMutation,
} = adminApi;
