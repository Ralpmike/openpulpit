---
name: hooks-and-helpers
description: Where shared client logic goes in OpenPulpit — the Redux Toolkit store (one RTK Query api slice, per-module endpoints, the small ui and player slices), custom hooks in hooks/ (LiveKit, Media Session, push), pure helpers in helpers/<domain>/, and imports. Use this whenever you add or change an API call, an endpoint, a tag, shared UI or player state, a LiveKit connection, web push subscription, or format durations, dates, data use or counts, or find yourself copying logic between files.
---

# Store, hooks and helpers

`@/` is `src/`. Server logic lives in `src/modules/*/server` and follows `cloudflare-nextjs` and `broadcasting-rules`.

## Redux Toolkit store

```
store/
  index.ts          # makeStore(): api.reducer + api.middleware + ui + player; RootState, AppDispatch
  api.ts            # the ONE createApi slice: baseQuery, tagTypes, no endpoints of its own
  StoreProvider.tsx # 'use client'; creates one store per request/tab (useRef), wraps the root layout
  uiSlice.ts        # shared UI state only
  playerSlice.ts    # what's playing: { kind: 'live' | 'replay', id, title, preacher }, isPlaying, speed
modules/<module>/store/endpoints.ts   # api.injectEndpoints per module
```

- **Next.js App Router:** the store is created per request in `StoreProvider` (`makeStore()`), never as a module-level singleton, so server renders never share state between users.
- **Server data goes through RTK Query in client components, never raw `fetch`.** Server components read through module services instead (see `component-builder`).
- `store/api.ts` creates one `createApi` with a `baseQuery` from `@/helpers/api/` (a `fetchBaseQuery` to `/api` that turns 401 into a redirect to `/login?next=…`).
- **Endpoints are grouped per module** with `api.injectEndpoints` in `modules/<module>/store/endpoints.ts`, each exporting its generated hooks (`useGetLiveNowQuery`, `useFollowPreacherMutation`, `useEndBroadcastMutation`).
- **Cache freshness uses tags.** `tagTypes` are declared once in `api.ts` (`Me`, `Preacher`, `Broadcast`, `LiveNow`, `Recording`, `Follow`, `NotificationSetting`, `Report`, `AdminQueue`, `Stats`). Queries `providesTags`; mutations `invalidatesTags` for everything they change. No hand-rolled refetching.
- **Endpoint naming:** queries `getX` / `listX`, mutations are verbs (`followPreacher`, `createBroadcast`, `endBroadcast`, `hideRecording`). Response types from the module's `models.ts`; request bodies from its `schemas/` types.
- **The `ui` slice holds only state several screens share.** Everything else stays in component state. Never copy server data into a slice; RTK Query's cache is the single owner.
- **The `player` slice holds what is playing**, so any page can start playback and the persistent player shows it. It holds plain serialisable data only.
- **LiveKit `Room` objects, `HTMLAudioElement`s and push subscriptions are never in Redux** (not serialisable). They live in hooks and a player context.

## Write a hook in `hooks/` (or a module's `hooks/`) when

- Logic is shared by two or more components and isn't a single generated RTK Query hook.
- It combines endpoints, a live connection, browser APIs, and effects into one clear interface.

| Type | Example | Rule |
| --- | --- | --- |
| Typed store access | `useAppDispatch`, `useAppSelector`, `useAppStore` (`hooks/store.ts`) | Always use these, never the untyped `useDispatch` / `useSelector` |
| Live publish | `useLiveBroadcast` (broadcasting) | Gets a token from the token route, connects with `livekit-client`, publishes the mic with the default audio settings from `broadcasting-rules`, exposes `connectionState`, `isReconnecting`, `listenerCount`, `end`; disconnects on unmount |
| Live listen | `useLivePlayer` (player) | Subscribe-only connection for one broadcast; exposes `isReconnecting`, `isPlaying`; one connection at a time |
| Browser API | `useMediaSession`, `useMicCheck`, `useWakeLock`, `usePushSubscription`, `useNetworkQuality` | Feature-detect first, degrade quietly where unsupported, clean up on unmount |
| UI state + derived | `useElapsedTime` | `useState` / `useMemo` only; no data fetching |
| Feature flow | `useGoLiveFlow` | Generated hooks + dispatch + effects; explicit return type at the top |

### Every hook

- Exports a named return type at the top: `type UseLivePlayerReturn = { ... }`.
- Doesn't wrap a single generated RTK Query hook just to rename it; components use the generated hook directly.
- Has a test at `hooks/__tests__/useXxx.test.ts` (or the module's `__tests__/`).

## Write a helper in `helpers/<domain>/` when

- It's a pure function: no React, no hooks, no JSX, no side effects.
- The same logic shows up in two or more files, or it's a clear formatter or calculator.

```
helpers/
  format/      # durations ("1 h 05 min", "12:34"), dates and relative time in Lagos time, counts ("1.2k")
  audio/       # mbPerHour(kbps), dataUseLabel ("About 15 MB per hour")
  time/        # lagosMonthStart(), minutesRemaining()
  api/         # baseQuery wrapper (401 → /login), getErrorMessage (RTK Query errors → plain text)
  bible/       # passage reference parsing and display ("John 3:16–18")
  config/      # client constants (page sizes, poll intervals)
  __tests__/   # all helper tests, named after the source file
```

- Import as `@/helpers/<domain>/<file>`. No barrel `index.ts` files, no files at the `helpers/` root, no deeper nesting.
- Helpers used by both server and client (time, audio) must stay free of browser and server-only APIs.
- Constants used only by one helper sit at the top of that helper's file.
- Add a new domain folder only when there are three or more related helpers that don't fit an existing one.

## Rules are server logic first

Who may go live, hours remaining, recording limits and visibility live in the modules' `server/policy.ts` as pure, tested functions. Client helpers only describe the result for display ("2 h 15 min left this month"); they never decide whether something is allowed. Follow `broadcasting-rules`.
