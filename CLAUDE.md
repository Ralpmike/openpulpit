# OpenPulpit (run by FutureLabs)

A web app where preachers go live with audio from a phone browser, and listeners follow them, listen live and replay sermons. Launch market: Nigeria. The MVP is audio only. PRD: "OpenPulpit PRD" (Claude Docs, https://claude.ai/artifact/8KfEbRE8ikojtGoTY285By), requirements 1–30, copied to `docs/PRD.md`. Tickets OP-1 to OP-42 are in `docs/TICKETS.md`; each one is GitHub issue #N on Ralpmike/openpulpit, with `epic:*`, `type:*`, `size:*` and `req:N` labels and a milestone (M1 Foundation, M2 Core MVP, M3 Trust and safety, M4 Beta). New issues are added to the "OpenPulpit" project board automatically by the board's own workflow.

- One Next.js app (App Router), deployed to Cloudflare Workers through OpenNext: pages, the JSON API (`src/app/api/`) and the LiveKit webhook.
- A modular monolith: `src/modules/` holds `accounts`, `broadcasting`, `library` (recordings), `social` (follows and notifications), `moderation` and `admin`. Each owns its tables and exposes a public server API through its `index.ts`.
- LiveKit carries the live audio and records it to R2 (Egress). D1 holds the data.

## Stack
Next.js (App Router) + TypeScript, Tailwind v4, shadcn/ui, lucide-react, Redux Toolkit + RTK Query, react-hook-form + Zod, sonner. Cloudflare Workers via `@opennextjs/cloudflare`, D1, R2. LiveKit (`livekit-client`, `livekit-server-sdk`). Better Auth on D1 (email and password, email one-time code, Google). Web Push (VAPID). Vitest, React Testing Library, Playwright. npm.

## Commands
Set up in OP-1 to OP-3; until then the repo has docs and skills only.
`npm run dev` · `npm run check` (typegen + tsc) · `npm run lint` · `npm test` · `npm run build` · `npm run preview` (OpenNext, real Worker locally) · `npm run deploy:staging` / `deploy:production` · `npm run db:migrate:local` / `db:migrate:staging` / `db:migrate:production` · `npm run db:seed:local` · `npm run cf-typegen` (after changing `wrangler.jsonc` or `.dev.vars.example`)

## Ground rules
- Mobile first and light on data: first load under 3 s on 3G, play within 3 s, default audio about 32 kbps Opus (under 15 MB an hour).
- Role and ownership checks on every API route, on the server. Preachers manage only their own broadcasts and recordings.
- Every admin action is logged. OpenPulpit does not police doctrine.
- Out of scope for the MVP (PRD "Not now"): video, native apps, payments and giving, live chat, co-hosts, scheduled broadcasts, non-English interface.

## Branches
- `dev` is the staging branch and the default: every ticket gets its own branch from `dev` and one pull request into `dev`, referencing `OP-N` and `Closes #N`. `dev` deploys to staging.
- `main` is production: it only receives pull requests from `dev` (a release, after `weekly-ship`). `main` deploys to production.
- Never push directly to `dev` or `main`.

## Skills to follow
Project skills live in `.claude/skills/`. The ones that define this codebase:
- `broadcasting-rules`: who may go live, token rights, lifecycle and reconnects, hours cap, data budget, recordings and the 20-recording limit, notifications, blocking, reports and admin audit.
- `cloudflare-nextjs`, `d1-schema`: route handlers, modules, bindings, LiveKit, R2, web push, and database changes.
- `component-builder`, `hooks-and-helpers`, `forms-and-schemas`, `loading-and-errors`, `baseline-ui`, `accessibility`, `design-md`, `frontend-performance`: UI work.
- `feature-from-prd` to plan a ticket; `testing`, then `convention-check` before calling a task done; `weekly-ship` before deploying.
- Design helpers: `shadcn`, `better-*`, `figma-to-code`, `component-canvas`, `interface-review`, `state-machine`, `break`, `variant`, `explain-interface`, `appllama-usage`.
