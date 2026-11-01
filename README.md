# OpenPulpit

Preachers go live with audio from a phone browser; listeners follow, listen live and replay sermons. Launch market: Nigeria. MVP is audio only.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Tickets: [docs/TICKETS.md](docs/TICKETS.md) (GitHub issues #1–#42)
- How we build: [CLAUDE.md](CLAUDE.md) and the skills in `.claude/skills/`

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run check` | Generate route types and type-check |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Branches

`dev` is staging and takes one pull request per ticket. `main` is production and only takes releases from `dev`.
