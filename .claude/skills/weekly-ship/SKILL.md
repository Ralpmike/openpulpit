---
name: weekly-ship
description: The OpenPulpit release checklist — checks and tests, D1 migrations applied remotely before deploy, Worker secrets and vars, LiveKit webhook and egress to R2, a real go-live and listen test on a phone on mobile data, cost checks, changelog, and a short note for the team and beta preachers. Use this whenever the person says they're shipping, releasing, deploying, or wrapping up the week, or asks what's left before release.
---

# Weekly ship

Run through this list and report each item as done, failed, or skipped (with a reason).

## Code

- [ ] `npm run check && npm run lint && npm test && npm run build` all pass, and CI is green on the pull request.
- [ ] `convention-check` skill run on everything changed this week; items fixed or listed as follow-ups.
- [ ] No change weakens a `broadcasting-rules` rule: who may go live, token grants, hours cap, recording visibility, notification rules, admin audit.
- [ ] Every issue closed this week has its acceptance criteria ticked.

## Database

- [ ] New migrations run cleanly on a fresh local database, and the seed still works.
- [ ] Migrations applied remotely **before** the code that needs them. The Deploy workflow does this (`dev` → staging, `main` → production); by hand it is `npm run db:migrate:staging` / `db:migrate:production` before `npm run deploy:staging` / `deploy:production`. Deploying first breaks every route that reads a new column.
- [ ] Each module's `models.ts` and `server/repo.ts` match the new schema.

## Configuration

- [ ] New secrets set with `npx wrangler secret put <NAME>` (never committed, never in `wrangler.jsonc` vars) and listed in `.dev.vars.example`.
- [ ] `npm run preview` (OpenNext build, real Worker locally) works, and staging (deployed from `dev`) has been checked before the release pull request from `dev` to `main`.
- [ ] LiveKit: the production webhook points at `/api/webhooks/livekit` and its signature check passes; egress can write to the R2 bucket.
- [ ] Google sign-in redirect URIs and the email sender domain still work on the production URL.
- [ ] VAPID keys unchanged (changing them silently breaks every existing push subscription).

## Real-world check

- [ ] On a real Android phone on mobile data (not Wi-Fi): sign in as a test preacher, mic check, go live, and listen from a second phone. Audio starts within 3 seconds of tapping play.
- [ ] Turn the preacher's data off for 20 seconds and back on: the broadcast stays live and listeners hear it resume.
- [ ] Lock the listener's phone: audio keeps playing and the lock screen shows the preacher and title.
- [ ] A follower gets exactly one push notification on go-live.
- [ ] End the broadcast: the recording appears on the profile, replays with seek and 2x speed, and its share link shows a preview card in WhatsApp.
- [ ] Data used for 10 minutes of listening is about 2.4 MB (14.4 MB an hour); check in the phone's data usage settings.
- [ ] Every screen works at 360px wide on a throttled 3G connection: loading states, not blank pages.
- [ ] Test broadcasts and recordings are deleted afterwards, and the test preacher's hours don't eat into a real preacher's.

## Cost

- [ ] LiveKit minutes and bandwidth for the week, and R2 storage, compared with last week (OP-41 alerts once they exist). Anything unusual is noted for the team.

## Release

- [ ] `CHANGELOG.md` has one line per change, in plain language.
- [ ] A short note for the team (2–3 lines, no jargon), and for beta preachers if anything they see has changed.
