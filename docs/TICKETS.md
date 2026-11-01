# OpenPulpit tickets

42 tickets across 8 epics, ready to become GitHub issues on Ralpmike/openpulpit. Each one carries labels for its epic, type, size and PRD requirement (for example `epic:broadcasting`, `type:backend`, `size:L`, `req:6`).

Sizes: S = up to 1 day, M = 2–3 days, L = 4–5 days. Milestones: M1 Foundation = OP-1 to OP-8 · M2 Core MVP = OP-9 to OP-33 · M3 Trust and safety = OP-34 to OP-39 · M4 Beta = OP-40 to OP-42.

| ID | Ticket | Epic | Req | Type | Size |
| --- | --- | --- | --- | --- | --- |
| OP-1 | Set up Next.js (App Router) repo with TypeScript, Tailwind and shadcn/ui | Foundation | — | infra | S |
| OP-2 | Configure OpenNext for Cloudflare and wrangler, with D1 and R2 bindings | Foundation | — | infra | M |
| OP-3 | CI on every PR: typecheck, lint, tests; preview deploys | Foundation | — | infra | M |
| OP-4 | Adapt the FutureLabs skills to Next.js and write CLAUDE.md | Foundation | — | docs | M |
| OP-5 | Write the broadcasting-rules skill (replaces outreach-rules) | Foundation | — | docs | S |
| OP-6 | Redux Toolkit store and RTK Query base API | Foundation | — | frontend | S |
| OP-7 | Initial D1 schema: users, preacher profiles, broadcasts, recordings, follows, reports | Foundation | — | db | M |
| OP-8 | DESIGN.md, theme tokens and mobile-first base layout | Foundation | — | design | M |
| OP-9 | Better Auth on D1: email and password, email one-time code | Accounts | 1 | backend | M |
| OP-10 | Google sign-in | Accounts | 1 | backend | S |
| OP-11 | Role choice at sign-up; listener applies to become a preacher | Accounts | 2 | fullstack | S |
| OP-12 | Preacher profile create and edit, plus public profile page | Accounts | 3 | fullstack | M |
| OP-13 | Verification request, admin approval and verified badge | Accounts | 4 | fullstack | M |
| OP-14 | Listener profile | Accounts | 5 | fullstack | S |
| OP-15 | LiveKit setup and token API route with role-based publish and listen rights | Broadcasting | 6 | backend | M |
| OP-16 | Go-live screen with mic check | Broadcasting | 6 | frontend | L |
| OP-17 | Broadcast details form: title, description, Bible passage | Broadcasting | 7 | frontend | S |
| OP-18 | Live view: listener count, elapsed time, end broadcast | Broadcasting | 8 | fullstack | M |
| OP-19 | Automatic reconnect for preacher and listeners | Broadcasting | 9 | frontend | M |
| OP-20 | Monthly broadcast-hours cap and remaining-hours display | Broadcasting | 10 | fullstack | M |
| OP-21 | Home page: live now, recent broadcasts, suggested preachers | Listening | 11 | fullstack | M |
| OP-22 | Live player with background playback and lock-screen info (Media Session) | Listening | 12 | frontend | L |
| OP-23 | Low-bitrate default (about 32 kbps Opus) and Wi-Fi quality toggle | Listening | 13 | fullstack | M |
| OP-24 | Data-use estimate shown to listeners | Listening | 14 | frontend | S |
| OP-25 | Search preachers by name, ministry, location, denomination | Listening | 15 | fullstack | M |
| OP-26 | Follow and unfollow a preacher | Social | 16 | fullstack | S |
| OP-27 | Web push: subscribe, and notify followers when a preacher goes live | Social | 17 | fullstack | L |
| OP-28 | Per-preacher notification toggle | Social | 18 | fullstack | S |
| OP-29 | Record broadcasts to R2 (LiveKit Egress) and save a recording on end | Library | 19 | backend | L |
| OP-30 | Manage recordings: rename, edit description, hide, delete | Library | 20 | fullstack | M |
| OP-31 | Replay player: seek, 1.5x and 2x speed, resume position | Library | 21 | frontend | M |
| OP-32 | Free-tier recording limit (keep the 20 newest) | Library | 22 | backend | S |
| OP-33 | Share page with WhatsApp and social preview card | Library | 23 | fullstack | M |
| OP-34 | Terms of use and community guidelines, accepted at sign-up | Trust and safety | 24 | fullstack | S |
| OP-35 | Report a broadcast, recording or profile | Trust and safety | 25 | fullstack | M |
| OP-36 | Admin moderation dashboard with audit log | Trust and safety | 26 | fullstack | L |
| OP-37 | Preacher blocks a listener | Trust and safety | 27 | fullstack | S |
| OP-38 | Admin platform stats | Trust and safety | 28 | fullstack | M |
| OP-39 | Preacher stats per broadcast | Trust and safety | 29 | fullstack | M |
| OP-40 | PWA: manifest, icons, install prompt | Beta | 30 | frontend | S |
| OP-41 | Cost monitoring: bandwidth and LiveKit-minutes alerts | Beta | — | infra | M |
| OP-42 | Beta onboarding for 5–10 preachers in Nigeria | Beta | — | ops | S |
