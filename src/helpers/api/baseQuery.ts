import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const API_BASE_URL = "/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "same-origin",
});

/** Where a 401 sends the person: the login page, coming back to where they were. */
export function loginRedirectUrl(currentPath: string): string {
  return `/login?next=${encodeURIComponent(currentPath)}`;
}

/**
 * fetchBaseQuery that unwraps our `{ data }` envelope and sends signed-out
 * people to /login. Error bodies stay `{ error: string }` for getErrorMessage.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && typeof window !== "undefined") {
    const path = `${window.location.pathname}${window.location.search}`;
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign(loginRedirectUrl(path));
    }
  }
  if (result.data && typeof result.data === "object" && "data" in result.data) {
    return { ...result, data: (result.data as { data: unknown }).data };
  }
  return result;
};
