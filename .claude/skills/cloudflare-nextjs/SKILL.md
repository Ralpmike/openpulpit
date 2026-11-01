---
name: cloudflare-nextjs
description: Engineering rules for the OpenPulpit server side — Next.js App Router on Cloudflare Workers through OpenNext, route handlers and their auth boundary, the modular monolith (accounts, broadcasting, library, social, moderation, admin), Cloudflare bindings (D1, R2), Better Auth, LiveKit (tokens, room service, egress, webhooks), web push, secrets and wrangler config. Use whenever you add or change a route handler, a server component that reads data, middleware, a webhook, a binding, a secret, wrangler.jsonc or open-next.config.ts, or any call to LiveKit, R2 or the push service.
---

# Next.js on Cloudflare

One Next.js app (App Router, TypeScript) built with `@opennextjs/cloudflare` and deployed as one Cloudflare Worker (`wrangler.jsonc`, `open-next.config.ts`). It serves the pages, the JSON API under `src/app/api/`, and the LiveKit webhook. LiveKit (cloud) carries the audio; D1 holds the data; R2 holds recordings.

## Modular monolith

```
src/
  app/                      # routes only: pages, layouts, route handlers. Thin.
    (public)/  (auth)/  (preacher)/  admin/
    api/<module>/…/route.ts
    api/webhooks/livekit/route.ts
  modules/
    accounts/  broadcasting/  library/  social/  moderation/  admin/
      server/               # import 'server-only'
        policy.ts           # pure rules, unit-tested (see broadcasting-rules)
        repo.ts             # D1 queries for this module's tables only
        service.ts          # use cases: policy + repo + LiveKit/R2/push
      index.ts              # the module's public server API for other modules
      components/  schemas/  models.ts  store/endpoints.ts  __tests__/
  lib/                      # cloudflare.ts (bindings), auth.ts (Better Auth), livekit.ts, r2.ts, push.ts
  components/ hooks/ helpers/ store/
migrations/                 # NNNN_name.sql (see d1-schema)
```

- A module reads and writes **only its own tables**. Another module's data comes through that module's `index.ts` (`import { getPreacher } from '@/modules/accounts'`), never by importing its `repo.ts` or querying its tables.
- `src/app/**` stays thin: parse input, check auth, call a module service, shape the response. No SQL and no business rules in `route.ts` or `page.tsx`.
- Everything under `modules/*/server` and `lib/` starts with `import 'server-only'`, so it can never end up in the client bundle.

## Boundaries

| Entry | Rule |
| --- | --- |
| `src/app/api/**/route.ts` | Every handler calls `requireSession()` / `requireRole('preacher' \| 'admin')` from `@/modules/accounts` first, unless it's on the public list below. Role and ownership are checked in the handler or service, never only in middleware or the UI (PRD NFR "Security") |
| Signed-in layouts (`(preacher)/layout.tsx`, `admin/layout.tsx`) | Redirect signed-out users to `/login?next=…` with `requireSession()` on the server. Next 16 renamed `middleware` to `proxy` (Node runtime only); we don't use one, so there is no extra hop on every request. Neither is a security boundary: route handlers check again |
| `/api/auth/[...all]` | Better Auth's handler. Public by design |
| `POST /api/webhooks/livekit` | Public. LiveKit signature verified before anything else; handlers idempotent (see `broadcasting-rules`) |
| `POST /api/broadcasts/:id/listen-token`, `GET /api/recordings/:id/audio` | Public (listening needs no account). Rate-limited, and visibility checked first |
| Server components that read data | Call module services directly (no fetch to our own API). Public pages (profiles, share pages) read only public fields |

Add a new public route only with a strong reason and its own check (signature, rate limit, visibility).

## Bindings and config

- Get bindings per request through `@/lib/cloudflare` (`getEnv()`, `getDb()`, `getRecordingsBucket()`, `waitUntil()`, `getLimits()`), which wraps `getCloudflareContext()`. Never cache `env` or a D1 handle in module scope across requests.
- Next 16 here runs **without** Cache Components (`cacheComponents` is off in `next.config.ts`), so route segment config such as `export const dynamic = 'force-dynamic'` applies.
- Better Auth is built per request in `lib/auth.ts` from the D1 binding (`getAuth()`), not as a module-level singleton.
- Secrets (`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` for LiveKit Egress, `VAPID_PRIVATE_KEY`, email provider key) are set with `npx wrangler secret put NAME` and locally in `.dev.vars` (never committed). Add each new name to `.dev.vars.example`, then `npm run cf-typegen` to regenerate `cloudflare-env.d.ts`.
- Non-secret settings (`LIVEKIT_URL`, `FREE_MONTHLY_BROADCAST_MINUTES`, `FREE_RECORDING_LIMIT`, `RECONNECT_GRACE_SECONDS`, `VAPID_PUBLIC_KEY`) go in `wrangler.jsonc` `vars`. Only values meant for the browser get a `NEXT_PUBLIC_` name.
- Never return a secret from a route, put one in a client component, or log one.

## Route handlers

- Validate every body and query with the module's Zod schema (`schemas/`) on the server. A client schema is for feedback, not security.
- Return JSON `{ data }` on success and `{ error: "<plain message>" }` with the right status on failure (400 bad input, 401 signed out, 403 wrong role or not the owner, 404 not found or hidden, 409 state conflict, 429 limit). No stack traces.
- Select only the columns the screen needs; never `SELECT *` to the browser.
- Ownership: preachers manage only their own broadcasts and recordings. Filter by the owner in the SQL (`WHERE id = ? AND preacher_id = ?`), not by checking after loading.
- Concurrent changes (status moves, counters) use compare-and-set or a single `UPDATE` with the condition in it; use `db.batch([...])` for writes that must land together (an admin action and its audit row).
- Set `export const dynamic = 'force-dynamic'` on handlers and pages that read per-user data; never let a signed-in response be cached.

## LiveKit

- Server SDK only (`livekit-server-sdk`) in `lib/livekit.ts`: `AccessToken` for tokens, `RoomServiceClient` to end rooms, `EgressClient` to record, `WebhookReceiver` to verify webhooks. Token grants follow `broadcasting-rules` exactly.
- Client SDK (`livekit-client`) only in client components and hooks (`useLiveBroadcast`, `useLivePlayer`). The client never sees the API secret.
- Room name = broadcast id. Webhooks find the broadcast from the room name.

## R2

- Recordings are private objects. Serve them through a route that checks visibility and passes Range requests through, or a short-lived signed URL created after that check.
- Object keys: `recordings/<preacher_id>/<broadcast_id>.ogg`. Photos: `avatars/<user_id>/<uuid>.webp` (resized before upload, size-limited).

## Web push

- VAPID keys; subscriptions stored per user and device in the social module. Send with a Workers-compatible implementation (Web Crypto, no Node-only libraries). Delete a subscription on 404/410.
- Fan-out to followers runs outside the request that triggered it (`ctx.waitUntil` from `getCloudflareContext()` for small batches; a Queue if fan-out grows).

## Runtime limits

- Workers have no filesystem and limited Node APIs: check a package works on Workers (`nodejs_compat`) before adding it. No `sharp`, no native modules.
- Keep request CPU low: no heavy work in a request path that a webhook or background task can do.

## Local runs

`npm run dev` runs `next dev` with bindings from wrangler (local D1 and R2, through `initOpenNextCloudflareForDev` in `next.config.ts`). `npm run preview` builds with OpenNext and runs the real Worker locally: use it before deploying anything that touches bindings, middleware or caching. LiveKit uses a dev project (or `livekit-server --dev` locally); point `LIVEKIT_URL` at it in `.dev.vars`.
