---
name: loading-and-errors
description: Loading, error, empty, reconnecting and refreshing states for every OpenPulpit screen that reads or writes data or plays audio — Next.js loading.tsx and error.tsx, the three loading tiers (page, section, button), naming RTK Query flags when a file uses several hooks, where errors show, the live player's connecting and reconnecting states, and mutation feedback with RTK Query. Use this whenever a component calls a generated query or mutation hook, connects to LiveKit, plays audio, shows a spinner or skeleton, shows an error or toast, or renders a list that could be empty.
---

# Loading and errors

Most listeners and preachers are on phones with slow, patchy and costly data. A screen must never look broken while it waits, never show "No one is live" before the real list arrives, and never treat a short network drop as the end of a sermon.

## Server state

- Server components read data before render; their route segment has a `loading.tsx` (a structural skeleton) and an `error.tsx` (a plain message and a retry button). `not-found.tsx` covers hidden or deleted profiles and recordings.
- Client components read and write through RTK Query hooks generated in `@/modules/<module>/store/endpoints.ts` (see `hooks-and-helpers`). No raw `fetch` inside components.
- Live audio state comes from `useLiveBroadcast` / `useLivePlayer` (`connectionState`, `isReconnecting`), not from Redux.

## Name your flags when a file uses two or more hooks

Rename at destructure time so flags never collide:

```tsx
const { data: liveNow, isLoading: isLiveNowLoading, isError: isLiveNowError } = useGetLiveNowQuery();
const { data: recent, isLoading: isRecentLoading } = useListRecentRecordingsQuery();
const [followPreacher, { isLoading: isFollowPreacherPending }] = useFollowPreacherMutation();
```

| Flag | Pattern | Examples |
| --- | --- | --- |
| Query `isLoading` (first load) | `is{Domain}Loading` | `isLiveNowLoading`, `isRecordingsLoading` |
| Query `isFetching` (refresh) | `is{Domain}Fetching` | `isRecordingsFetching` |
| `isError` | `is{Domain}Error` | `isProfileError` |
| `error` | `{domain}Error` | `recordingsError` |
| Mutation `isLoading` | `is{Action}Pending` | `isEndBroadcastPending`, `isFollowPreacherPending` |
| Mutation `isSuccess` | `is{Action}Success` | `isSubmitReportSuccess` |

Never leave a bare `isLoading` or `isError` once a second hook is in the file. Build readable booleans from the aliases:

```tsx
const showPageLoading = isLiveNowLoading || isRecentLoading;
```

## States

- **First load:** `isLoading` (no data yet). Show the loading tier below.
- **Refreshing:** `isFetching` with data already present. Keep showing the cached data; don't swap back to a skeleton.
- **Empty:** loaded, not an error, and data is `[]` or `null`. Never show the empty state during first load.
- **Offline or bad signal:** keep showing the last loaded data with a small "Last updated 2 min ago" note instead of an error.

## Live audio states

| State | Preacher sees | Listener sees |
| --- | --- | --- |
| Connecting | "Connecting…" on the Go live button (`LoaderButton`) | Spinner on Play, "Connecting…" |
| Live | Live badge, elapsed time, listener count (`tabular-nums`) | Live badge, preacher and title, Pause |
| Reconnecting | `Alert`: "Connection dropped. Reconnecting… you're still live for up to a minute." | "Reconnecting…", playback resumes on its own |
| Ended | `StatusDialog`: "Broadcast ended. Your recording will appear on your profile shortly." | "This broadcast has ended" with a link to the replay when ready |
| Failed | `Alert` with what to do ("Check your connection and try again") | "Couldn't connect" with Retry |

Reconnecting and live changes are announced in a polite live region (see `accessibility`). Never show a raw LiveKit error.

## Three loading tiers

| Tier | When | Show |
| --- | --- | --- |
| Page | The main thing on the page is loading (home lists, a profile) | `loading.tsx` skeleton for server components, or `LoadingOverlay` over the page; keep the header, bottom nav and player bar visible |
| Section | One card or panel is loading (a preacher's recordings, stats) | `SectionLoadingSkeleton` (built on shadcn `Skeleton`) in that card's shape; keep toolbars outside it |
| Button | A mutation is running (follow, go live, end, save, report) | `LoaderButton` molecule (shadcn `Button` + `Spinner` + `disabled`) with `loading={isXxxPending}`; disable it and any secondary button while pending |

Don't scatter ad-hoc `animate-pulse` blocks or a lone "Loading…" text. Use the shared molecules: `LoadingOverlay`, `SectionLoadingSkeleton`, `LoaderButton`.

Toasts use `sonner` (`toast.error(getErrorMessage(error))`).

## Where errors show

| Situation | Show |
| --- | --- |
| The page's main data failed | `error.tsx` or an inline `Alert` with a Retry button (`refetch`) |
| One card failed (recordings list, stats) | Inline message inside that card |
| Supplementary data failed (follower count) | Nothing blocking; keep the last value |
| A user action failed (follow, save, report) | Toast, and inline next to the action; the button returns to normal |
| Going live refused (no hours left, suspended, mic blocked) | Inline `Alert` on the go-live screen saying why and what to do; never only a toast |
| A milestone succeeded ("You're live", "Report sent") | Toast, or `StatusDialog` for going live and ending |

Use the shared `getErrorMessage` helper (`@/helpers/api/`) to turn RTK Query errors (`FetchBaseQueryError` / `SerializedError`) into plain, friendly text. The API returns `{ error: "<plain message>" }`; never show raw stack traces.

## Mutation feedback

- Put success and error feedback in **one place**: either `await trigger(args).unwrap()` in the handler with the toast in its `try/catch`, or the endpoint's `onQueryStarted`. Not both.
- Follow and unfollow may be optimistic (`onQueryStarted` with `updateQueryData`, undone on failure). Going live, ending and deleting are never optimistic.
- Handlers only trigger the mutation and show feedback; they never refetch by hand. The mutation's `invalidatesTags` refreshes the affected queries.
- Prevent double submits: the button is disabled from the first click until the mutation settles. This matters most for "Go live" and "End broadcast".

## Empty states

Build empty states with shadcn's `Empty` component, never custom markup. Each has one clear next action.

| Case | Show |
| --- | --- |
| No one is live now | "No one is live right now" + "Browse recent sermons" (`data-testid="live-now-empty-state"`) |
| Preacher has no recordings | Listener: "No sermons yet. Follow to hear when they go live." Owner: "Your broadcasts will appear here when they end." + Go live |
| Listener follows no one | "Follow preachers to hear when they go live" + Search |
| Search returns nothing | A separate "no matches" variant with a clear-search action |
| Admin report queue empty | "No reports waiting" |

## Tests

For each surface with data, test: the loading state (`*-loading`), the error state, the empty state (`*-empty-state`), and that the action button is disabled with a spinner while its mutation is pending. For live audio, test the reconnecting and ended states with a mocked hook. Render with the test store helper and mock at the API boundary (see `testing`).
