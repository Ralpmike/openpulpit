---
name: d1-schema
description: How to change the OpenPulpit database on Cloudflare D1 — numbered migrations in migrations/, table ownership per module, CHECK constraints for enums, indexes for the home page, search and webhook lookups, Better Auth's tables, applying local then remote, and keeping models.ts, repo.ts and the seed in step. Use this whenever you add or change a table, column, index, or constraint, or a feature needs data that doesn't exist yet.
---

# D1 schema

The schema lives in `migrations/NNNN_short_name.sql` (`0001_init.sql`, `0002_add_bible_passage.sql`), applied in order by Wrangler (`migrations_dir` in `wrangler.jsonc`).

## Rules

- **Never edit a migration that has been applied** anywhere (local or remote). Write a new one.
- **Every table belongs to one module** (accounts, broadcasting, library, social, moderation, admin), noted in a comment at the top of the `CREATE TABLE`. Only that module's `server/repo.ts` reads or writes it (see `cloudflare-nextjs`).
- **Better Auth owns its tables** (`user`, `session`, `account`, `verification`). Generate their migration with the Better Auth CLI, review it, and commit it as a numbered file. Our own profile data goes in our tables (`preacher_profiles`, `listener_profiles`) keyed by the auth user id, not in extra Better Auth columns, except `role` and `status`, which Better Auth's session needs.
- **Enums are `TEXT` with a `CHECK (col IN (...))`** constraint, matching the TypeScript union in the module's `models.ts` and the policy code. Adding a value means a new migration that rebuilds the table (SQLite can't alter a CHECK), so think before adding enums. Current ones: `role` (`listener`, `preacher`, `admin`), user `status` (`active`, `warned`, `suspended`, `banned`), broadcast `status` (`ready`, `live`, `ended`), `ended_reason`, recording `status` (`processing`, `ready`, `failed`, `deleted`) and `visibility` (see `broadcasting-rules`).
- **Text columns default to `''` and are `NOT NULL`** unless "unknown" genuinely differs from empty (an optional Bible passage is `''`). Timestamps are ISO-8601 UTC strings (`strftime('%Y-%m-%dT%H:%M:%fZ','now')`); convert to Lagos time only for display and for the monthly hours cap.
- **Durations are whole seconds** (`duration_seconds`), sizes whole bytes, bitrates whole kbps. No floats for anything summed.
- **IDs are TEXT UUIDs** from `crypto.randomUUID()`; the seed uses fixed UUIDs so it can be re-run.
- **Public slugs** (preacher profile link, requirement 3) are unique, lowercase, and separate from ids.
- **Index what the hot paths look up:**
  - home page: live broadcasts (`status, started_at`), recent ready public recordings (`status, visibility, created_at`);
  - a preacher's recordings (`preacher_id, created_at`) and monthly hours (`preacher_id, started_at`);
  - followers of a preacher (`preacher_id`) and follows of a listener (`listener_id`), unique on the pair;
  - webhook lookups by `egress_id`; reports queue (`status, created_at`);
  - search (requirement 15): an FTS5 table over name, ministry, location and denomination, kept in step by triggers.
- **Index every foreign key column** a delete cascades or checks through (with foreign keys on, deleting a user scans child tables without one).
- Foreign keys are on; insert parents first. In seed SQL remember that `INSERT OR IGNORE` also silently skips rows that violate `NOT NULL` or `CHECK`.

## In the same change

1. The migration file.
2. The owning module's `server/repo.ts` row types and queries.
3. The module's `models.ts` (types the client sees).
4. `scripts/seed.sql` (or `seed.mjs`) if seeded data is affected: Nigerian names, cities and ministries.
5. RTK Query endpoints and tags if the API shape changed.

## Apply

```bash
npm run db:migrate:local      # fresh local check
npm run db:seed:local
npm run check && npm test
npm run db:migrate:remote     # before deploying the code that needs it
```

To start a local database from scratch, stop the dev server, delete `.wrangler/state/v3/d1`, then migrate and seed.

## Privacy (NDPA 2023)

- Collect only what a requirement needs. No phone numbers, birth dates or ID documents unless a requirement asks (verification method is an open question in the PRD).
- Never store raw IP addresses; rate limits use a salted hash that expires.
- Deleting an account deletes or anonymises its rows; `audit_log` keeps the action with the target id only.

## Don't

- Store secrets in tables (push subscription keys are not secrets; VAPID private key is).
- Return whole rows (`SELECT *`) to the browser; select the columns the screen needs.
- Delete from `audit_log` in a migration or anywhere else.
