---
name: convention-check
description: Post-task convention check for OpenPulpit. Run this after finishing any task that creates or changes a file in src/ (app routes, modules, components, store, hooks, helpers, schemas, lib) or migrations/ — and whenever the person asks for a review, a cleanup, or "check my code". Produces a numbered list of follow-ups.
---

# Post-task convention check

Run this after finishing implementation. Once `npm run check:conventions` exists (the same checks in a script), run it too.

Go through each item for every file changed in the task. Flag violations as numbered follow-ups; they are not blockers, except the ones marked urgent.

## Checklist

### 1. Naming

- Booleans use a full predicate (`isLive`, `hasMicPermission`, `canGoLive`). No abbreviations, bare words (`live`, `loading`), or number suffixes.
- With two or more RTK Query hooks in a file, flags are aliased (`isLiveNowLoading`, `isFollowPreacherPending`, not bare `isLoading`).

### 2. Module boundaries

- SQL or business rules in `src/app/**` (`page.tsx`, `route.ts`) → move to the module's `server/` (see `cloudflare-nextjs`).
- A module importing another module's `server/repo.ts`, or querying another module's tables → go through that module's `index.ts`.
- A file in `modules/*/server` or `lib/` without `import 'server-only'` → add it.
- A client component (`'use client'`) importing server-only code → fix immediately (urgent).
- `'use client'` on a whole page when only a leaf needs it → push it down.

### 3. Page / form split

- A page or container that contains a form and its fields → extract a co-located `*Form.tsx`.

### 4. Repeated fields

- The same `Controller` + `Field` + `FieldLabel` + `Input` + `FieldError` block appears twice or more → use the `FormFieldInput` molecule.

### 5. Schema and type placement

- `z.object(` inside `components/`, a route handler or `models.ts` → move to the module's `schemas/`.
- A route handler that doesn't validate its input with the module's Zod schema → add it.
- A row type defined inside a component or hook → move to the module's `models.ts`.
- A `models.ts` type that no longer matches its table in `migrations/` or the row type in `server/repo.ts` → update it.

### 6. Duplication

- Scan `components/ui/atoms/` and `components/ui/molecules/` for an existing component that does the same thing → reuse it.
- Pure logic duplicated across files → move to `helpers/<domain>/`.
- A broadcasting, recording, notification or moderation rule outside the module's `server/policy.ts`, or re-implemented in the client → move it there (see `broadcasting-rules`).

### 7. Data access

- Raw `fetch` in a client component or hook → add an endpoint with `api.injectEndpoints` in the module's `store/endpoints.ts` and use its generated hook.
- A server component fetching our own `/api` → call the module service directly.
- A second `createApi` → merge it into `@/store/api.ts`; there is exactly one.
- A store created at module scope instead of per request in `StoreProvider` → fix (urgent: state can leak between users).
- A mutation without `invalidatesTags` for what it changes, or a handler that refetches by hand → use tags.
- Server data copied into a Redux slice, or non-shared UI state added to `uiSlice` → keep server data in RTK Query's cache and local state in the component.
- A LiveKit `Room`, audio element or other non-serialisable object in Redux → move it to a hook or the player context.
- Untyped `useDispatch` / `useSelector` → use `useAppDispatch` / `useAppSelector` from `@/hooks/store`.
- `SELECT *` in a route that returns data to the browser → select only needed columns.
- A secret (`LIVEKIT_API_SECRET`, `BETTER_AUTH_SECRET`, `VAPID_PRIVATE_KEY`, R2 keys, Google client secret) referenced in a client component, a `NEXT_PUBLIC_` variable, a response or a log → remove immediately (urgent).
- A new `/api/` route without `requireSession` / `requireRole` that isn't on the public list in `cloudflare-nextjs` → fix immediately (urgent).
- A route that loads a broadcast or recording by id without filtering by owner (for preachers) → fix immediately (urgent).

### 8. Broadcasting safety (urgent)

- Any code path that mints a publish token without every check in `broadcasting-rules` (preacher, good standing, owner, status, hours left, not already live) → fix immediately.
- A listener token with publish or data rights → fix immediately.
- A hidden or deleted recording reachable from a public list, search, share page or audio route → fix immediately.
- An admin action without its `audit_log` row in the same batch → fix immediately.
- A raised default bitrate, or anything pushing default audio over 15 MB an hour → fix.
- A webhook handler that isn't idempotent or skips the signature check → fix immediately.

### 9. Database

- An edit to a migration that has already been applied → revert it and write a new migration (see `d1-schema`).
- A schema change without matching updates to the seed, `models.ts`, and `server/repo.ts` → update them.
- An unindexed foreign key or hot-path lookup → add the index.
- Personal data collected that no requirement needs → remove (NDPA 2023).

### 10. UI states

- A data screen missing a loading, error, or empty state, or a route segment without `loading.tsx` / `error.tsx` where it reads data → add it (see `loading-and-errors`).
- Live audio UI without connecting, reconnecting and ended states → add them.
- A mutation button not disabled while pending → fix.
- Raw hex colours or arbitrary Tailwind values (`p-[13px]`, `bg-[#111]`) → use theme tokens.
- Hand-joined class strings with conditionals → use `cn()`.
- New ad-hoc `animate-pulse` blocks → use `SectionLoadingSkeleton`.
- `space-x-*` / `space-y-*` → `flex` + `gap-*`.
- Custom empty-state markup → shadcn `Empty`; custom callouts → `Alert`; custom status spans → `Badge`.
- Sizing classes on icons inside components → use `data-icon` and let the component size them.
- Manual `z-index` on dialogs, sheets, or popovers → remove; they stack themselves.
- `<img>` instead of `next/image`, or an image without width, height and alt → fix.

### 11. Visual baseline and accessibility

- `h-screen` → `h-dvh`.
- Changing numbers (listener counts, elapsed time, hours left, durations) without `tabular-nums`.
- Going live, ending a broadcast, deleting a recording, blocking, or any admin action without an `AlertDialog`.
- Icon-only buttons (play, pause, skip, speed, mute) without `aria-label`; inputs without a visible label.
- Status shown by colour alone (live, verified, hidden, report status).
- Player controls under 44px on phones, or not reachable by keyboard.
- Animation of anything other than `transform`/`opacity`, or blur on large surfaces.
- New or changed tokens not reflected in `DESIGN.md`.

### 12. `data-testid`

- Every new interactive component has `data-testid` on its root element.

### 13. Test coverage

- Every new or changed file in `modules/*/server`, `components/`, `hooks/`, `helpers/`, `schemas/`, or `store/` has a test at its domain boundary (see the table in `testing`).
- Every change to a `server/policy.ts` has a test for the rule it changes.
- Every new route handler has signed-out, wrong-role and not-the-owner tests.
- If absent: "Missing test — expected at `<path>`".
  Example: `modules/broadcasting/components/partials/MicLevel.tsx` → `modules/broadcasting/__tests__/MicLevel.test.tsx`
- If the test file exists but doesn't import the new export: "Test file may not cover new export `<ExportName>`".

### 14. Test folders

- Any `__tests__/` folder not at a domain boundary (`components/ui/atoms`, `components/ui/molecules`, `modules/<module>`, `hooks`, `helpers`, `store`) → move it.

## Output

A numbered report:

```
Convention check — 2 item(s) to address:

1. [naming] `live` → rename to `isLive`
2. [coverage] Missing test — expected at src/modules/broadcasting/__tests__/MicLevel.test.tsx
```

If nothing is found: "Convention check passed ✓".
