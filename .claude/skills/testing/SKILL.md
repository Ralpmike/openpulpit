---
name: testing
description: How to test OpenPulpit — what must be tested, which tool to use (Vitest for policies and services, React Testing Library with a test Redux store, Playwright for end-to-end on a phone viewport, local Worker runs with wrangler and OpenNext preview), where test files live, and data-testid conventions. Use this whenever you write or change code in src/ or migrations/, whenever you write or fix a test, and before saying a task is done.
---

# Testing

## Tools

| What | Tool |
| --- | --- |
| Module rules (`server/policy.ts`), helpers, schemas | Vitest in Node. Pure functions, no mocks needed |
| Module services and route handlers | Vitest with a fake D1 (better-sqlite3 running the real `migrations/`, or Miniflare's D1) and stubbed LiveKit, R2 and push clients from `test/stubs/`. Call the exported `GET`/`POST` with a `Request` |
| LiveKit webhooks | Vitest with signed sample payloads (valid, tampered, missing signature, repeated delivery) |
| Client components, hooks, store endpoints | Vitest + React Testing Library + jsdom. The default environment is Node; component and hook tests start with `// @vitest-environment jsdom` |
| Main user journeys | Playwright on a 360×740 phone viewport against `npm run preview`, with LiveKit pointed at a local `livekit-server --dev` |
| Real conditions | A real Android phone on mobile data before each beta release (see `weekly-ship`) |

## Where tests live — at the domain boundary only

| Source | Test |
| --- | --- |
| `modules/<m>/server/*.ts` | `modules/<m>/__tests__/<file>.test.ts` |
| `modules/<m>/components/**/X.tsx` (including `partials/`) | `modules/<m>/__tests__/X.test.tsx` |
| `modules/<m>/store/endpoints.ts` | `modules/<m>/__tests__/endpoints.test.ts` |
| `modules/<m>/schemas/x.ts` | `modules/<m>/__tests__/x.schema.test.ts` |
| `app/api/**/route.ts` | `modules/<m>/__tests__/<name>.route.test.ts` for the module it calls |
| `components/ui/atoms/X.tsx`, `components/ui/molecules/X.tsx` | `components/ui/atoms/__tests__/X.test.tsx`, `components/ui/molecules/__tests__/X.test.tsx` |
| `hooks/useX.ts` | `hooks/__tests__/useX.test.ts` |
| `helpers/<domain>/x.ts` | `helpers/__tests__/x.test.ts` |
| `store/*.ts` | `store/__tests__/x.test.ts` |
| End-to-end | `e2e/<journey>.spec.ts` |

Paths are under `src/` except `e2e/`. Never create a `__tests__/` folder deeper than these (e.g. not under `partials/`).

## Must be tested

- **Who may go live** (`broadcasting-rules`): every refusal of the token route: signed out, listener role, suspended, not the owner, ended broadcast, no hours left, already live. And the grants of each token (publish mic only; listeners subscribe only).
- **Hours cap:** Lagos month boundaries (a broadcast at 23:30 on the last day, UTC vs Lagos midnight), the running time of a live broadcast, the 10-minute warning and the end at 0.
- **Lifecycle:** `ready → live → ended` only forward; a repeated webhook changes nothing; a reconnect within the grace keeps it live and sends no second notification or recording.
- **Recordings:** ready only after `egress_ended`; the 20-recording limit deletes the oldest; hidden recordings are absent from lists, search, share pages and the audio route; a preacher can't unhide an admin hide.
- **Data budget:** `mbPerHour(32)` is 14.4 and the default publish options stay at the 32 kbps target.
- **Notifications:** one per broadcast; muted, blocked and gone subscriptions are skipped.
- **Moderation:** every admin action writes its audit row in the same batch; non-admins get 403.
- **Webhook signatures:** valid, tampered, old, and missing.
- **Route security:** every new route handler has a test that a signed-out request and a wrong-role request are refused, and that a preacher can't touch another preacher's broadcast or recording.
- **Every data screen:** loading, error, empty, and pending-button states (see `loading-and-errors`).
- **Store:** each mutation invalidates the tags it should.
- **Schemas:** valid and invalid examples, especially slugs, Bible passages and length limits.

## Conventions

- Render components with the test store helper `renderWithStore` (`src/test/renderWithStore.tsx`), which builds a fresh store per test.
- Mock at the API boundary: intercept `/api/*` with msw. Never call real LiveKit, R2, Google or a push service from a unit test.
- Mock `useLiveBroadcast` / `useLivePlayer` in component tests; don't open WebRTC connections. Stub `navigator.mediaDevices`, `navigator.mediaSession` and `Notification` where needed.
- Query elements by `data-testid` or accessible role, not CSS classes.
- Use fixtures in `src/test/fixtures/<module>/` with realistic data: Nigerian names and ministries ("Pastor Adebayo Ogunleye, Living Word Chapel, Ibadan, Oyo"), real Bible references, real-looking sermon titles, and long names that wrap.
- Freeze time (`vi.useFakeTimers`, `vi.setSystemTime`) for anything involving the monthly cap, elapsed time, grace periods or "x minutes ago", and set it in Lagos terms.

## Before saying done

Run `npm run check && npm run lint && npm test` (the same as CI, `.github/workflows/ci.yml`), and `npm run build` if config, routes or dependencies changed. If a migration changed, apply it to a fresh local database and run the seed. Run the Playwright journey for the area you touched when it exists. Then run the `convention-check` skill.
