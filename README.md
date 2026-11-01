# OpenPulpit

Preachers go live with audio from a phone browser; listeners follow, listen live and replay sermons. Launch market: Nigeria. MVP is audio only.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Tickets: [docs/TICKETS.md](docs/TICKETS.md) (GitHub issues #1–#42)
- How we build: [CLAUDE.md](CLAUDE.md) and the skills in `.claude/skills/`

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
cp .dev.vars.example .dev.vars   # local secrets, never committed
npm run db:migrate:local
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run check` | Generate route types and type-check |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit and component tests) |
| `npm run build` | Next.js production build |
| `npm run preview` | OpenNext build, then the real Worker locally with local D1 and R2 |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` after changing `wrangler.jsonc` or `.dev.vars.example` |
| `npm run db:migrate:local` | Apply D1 migrations to the local database |
| `npm run deploy:staging` / `deploy:production` | Build and deploy to Cloudflare |
| `npm run db:migrate:staging` / `db:migrate:production` | Apply migrations remotely (before deploying code that needs them) |

## Cloudflare setup (once)

`wrangler.jsonc` has three setups: local (top level), `staging` (from `dev`) and `production` (from `main`). Create the remote resources with the commands at the top of `wrangler.jsonc`, paste the D1 ids in place of `REPLACE_WITH_…`, and set each secret from `.dev.vars.example` with `npx wrangler secret put NAME --env staging` (and `--env production`). `GET /api/health` answers `{"status":"ok"}` when the Worker and D1 are up.

## Branches

`dev` is staging and takes one pull request per ticket. `main` is production and only takes releases from `dev`.

## CI and deploys

- `.github/workflows/ci.yml`: every pull request into `dev` or `main` runs typecheck, lint, tests, migrations on a fresh local D1 and the OpenNext build, then uploads a preview version of the staging Worker (`pr-<number>` alias; the URL is in the job summary).
- `.github/workflows/deploy.yml`: a push to `dev` deploys staging, a push to `main` deploys production, migrations first.
- Both need the repository secrets `CLOUDFLARE_API_TOKEN` (Workers, D1 and R2 edit) and `CLOUDFLARE_ACCOUNT_ID`; until they're set, the preview and deploy jobs skip themselves. Create GitHub environments `staging` and `production` (add required reviewers on `production`).
