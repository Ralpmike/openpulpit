---
name: feature-from-prd
description: How to start a new OpenPulpit feature from the PRD and its GitHub issue — find the requirement (1–30) and ticket (OP-1 to OP-42), check scope against the "Not now" list, break it into small shippable tasks with clear done conditions, and plan the order (migration, policy, service and route, RTK Query, UI, tests). Use this whenever the person asks to build, start, or plan a feature, mentions a requirement number or an OP ticket, or asks "what should I build next".
---

# Feature from the PRD

The "OpenPulpit PRD" (Claude Docs: https://claude.ai/artifact/8KfEbRE8ikojtGoTY285By) is the source of truth, with a copy in `docs/PRD.md` and the tickets in `docs/TICKETS.md`. Each ticket is a GitHub issue titled `OP-N: …` with `epic:*`, `type:*`, `size:*` and `req:N` labels and a milestone (M1 Foundation, M2 Core MVP, M3 Trust and safety, M4 Beta). The team edits the doc, so when it matters, read the live doc with the Claude Docs tools and update `docs/PRD.md` if it changed.

## Steps

1. **Find the ticket and requirement.** Quote the OP id, the requirement number and its text, and the issue's acceptance criteria. If the request matches no ticket, say so and ask whether to add one.
2. **Check scope.** Flag it before building if it's on the "Not now" list: video, native apps, payments or giving or premium, live chat or comments, co-hosts or call-ins, scheduled broadcasts, non-English interface, music licensing. Flag work that belongs to a later milestone than the current one.
3. **Check the rules.** Anything that mints a token, goes live, records, plays, hides or deletes a recording, notifies, counts hours or listeners, or lets an admin act follows `broadcasting-rules`.
4. **Check dependencies** listed on the issue (most features need OP-7's schema and OP-9's auth).
5. **Break it down** into tasks that can each ship in a day or less, in this order:
   1. Database change (`d1-schema`)
   2. Pure rules in the module's `server/policy.ts` and helpers, with tests
   3. Service and route handler or webhook (`cloudflare-nextjs`)
   4. RTK Query endpoints and tags in the module's `store/endpoints.ts`, plus any shared hook (`hooks-and-helpers`)
   5. UI (`component-builder`, `forms-and-schemas`, `loading-and-errors`), mobile first
   6. A local end-to-end check of the main path (`npm run dev`, or `npm run preview` for anything touching bindings), on a phone-width screen with a throttled connection
6. **Write done conditions** for each task in plain language the team would recognise, e.g. "A preacher with 0 hours left sees 'No broadcast hours left this month' and the Go live button is disabled; the token route answers 403."
7. **Note open questions** instead of guessing (the PRD's own list: anonymous listening, exact caps, verification method, legal review of guidelines).

## Output

A short plan: ticket and requirement, tasks with done conditions, open questions. Confirm the plan before writing code when the feature spans more than one task. Work on a branch per ticket and reference `OP-N` and `Closes #<issue>` in the pull request.

## Keep it small

If a ticket won't fit its size label (S up to 1 day, M 2–3 days, L 4–5 days), split it into a version that delivers value now and a follow-up issue.
