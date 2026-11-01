---
name: broadcasting-rules
description: The OpenPulpit rules for going live, listening, recording and moderation — who may publish, LiveKit token rights, the broadcast lifecycle and one-live-per-preacher, reconnect grace, the monthly hours cap, the data budget (~32 kbps Opus, under 15 MB an hour), recordings in R2 and the 20-recording limit, hidden and deleted content, go-live notifications, blocking, reports and admin actions with the audit log. Use this whenever you touch anything that mints a LiveKit token, starts, ends or reconnects a broadcast, records, stores, plays, hides or deletes a recording, notifies followers, counts hours or listeners, or lets an admin act — in the UI, a route handler, a webhook, or the database.
---

# Broadcasting rules

Preachers go live to real listeners on costly mobile data, and every minute streamed costs us bandwidth and LiveKit minutes. A wrong rule here either lets the wrong person broadcast, loses a sermon, or runs up the bill. So the rules are strict and live in one place: pure, unit-tested functions in each module's `server/policy.ts` (`src/modules/broadcasting/server/policy.ts`, `src/modules/library/server/policy.ts`, `src/modules/social/server/policy.ts`, `src/modules/moderation/server/policy.ts`), called by route handlers and webhooks, never re-implemented in the client.

PRD: `docs/PRD.md` (requirements 6–10, 12–14, 17–29). When a rule here and the PRD disagree, the PRD wins: update this file in the same change.

## Who may go live

A LiveKit publish token is minted only by `POST /api/broadcasts/:id/token` (broadcasting module), and only when **all** of these hold, checked on the server in this order:

1. **Signed in** with a Better Auth session (not just a cookie that looks right).
2. **Role is `preacher`.** A listener who applied to become a preacher (requirement 2) can't publish until the application is approved.
3. **Account is in good standing:** not suspended or banned (`users.status`). A warning doesn't block.
4. **Owns the broadcast:** `broadcasts.preacher_id` is the signed-in user. Never take the preacher from the request body.
5. **Broadcast is `ready` or `live`** (see the lifecycle below), never `ended`.
6. **Hours remain** this month (`remainingBroadcastMinutes > 0`, below).
7. **No other live broadcast** for this preacher (one live broadcast per preacher at a time).

The token's grants: `roomJoin`, `room = broadcast id`, `canPublish: true`, `canPublishSources: [MICROPHONE]` (audio only for the MVP: no camera, no screen share), `canSubscribe: false`, `canPublishData: false` (no live chat in the MVP). Identity is the preacher's user id. TTL is short (10 minutes is enough to join; reconnects within a session don't need a new token).

## Who may listen

- Listening needs **no account** (PRD §4). `POST /api/broadcasts/:id/listen-token` mints a subscribe-only token for a `live` broadcast: `canSubscribe: true`, `canPublish: false`, `canPublishData: false`, `hidden: false`. Anonymous identities are random (`anon-<uuid>`), never an IP or device id.
- The listen-token route is public, so it is rate-limited per network and refuses broadcasts that aren't `live` or were ended by an admin.
- An account is needed to follow, get notifications and report (requirements 16–18, 25).

## Broadcast lifecycle

`broadcasts.status` is one of `ready` → `live` → `ended`. Moves go only forward; code moves a broadcast with a compare-and-set (`UPDATE … SET status = 'live' WHERE id = ? AND status = 'ready'`), because the preacher's client, LiveKit webhooks and admins act at the same time.

- **ready:** created by the go-live screen with a title (required), description and Bible passage (optional, requirement 7). Nothing is public yet.
- **live:** set when LiveKit reports the preacher's microphone track published (`track_published` webhook for the preacher identity), not when the button is pressed. `started_at` is set here. This is when followers are notified (below) and recording starts.
- **ended:** set once, with `ended_at` and `ended_reason`: `preacher` (they pressed End), `disconnected` (grace ran out), `hours_cap` (monthly hours used up), `admin` (an admin ended it), or `error`. Ending stops recording and deletes the LiveKit room.

## Reconnects (requirement 9)

- The preacher's client reconnects automatically (LiveKit's own reconnect, then a full rejoin with a fresh token if that fails). Listeners' players reconnect the same way and resume the stream.
- A preacher who drops is **not** ended at once. The room's `departureTimeout` and our own grace (`RECONNECT_GRACE_SECONDS`, 60 by default) keep the broadcast `live`. Only when the grace runs out without the preacher's track coming back is it ended with `disconnected`.
- A reconnect never notifies followers again, never starts a second recording and never creates a second broadcast.
- Listeners see "Reconnecting…" (a polite live region), not an error, during the grace period.

## Monthly hours cap (requirement 10)

- Free tier: `FREE_MONTHLY_BROADCAST_MINUTES` (600 = 10 hours), from config, never hard-coded in a component.
- The month is the **Lagos calendar month** (Africa/Lagos, UTC+1, no daylight saving). Use the shared `lagosMonthStart()` helper, never the server's local time or UTC midnight.
- Used minutes = sum of `ended_at - started_at` for this month's broadcasts, plus the running time of a live one. A broadcast that crosses midnight at month end counts towards the month it started in.
- The go-live screen shows the remaining hours before going live. The token route refuses at 0.
- During a broadcast the server enforces the cap: warn the preacher at 10 minutes left, end with `hours_cap` at 0. The client only displays the countdown; it never decides.

## Data budget (requirements 13–14, NFR "Data use")

- Default audio is **Opus, mono, about 32 kbps**, which is 32 × 3600 / 8 / 1000 = 14.4 MB an hour. Default live and replay audio must stay under 15 MB an hour; nothing may raise the default.
- DTX (discontinuous transmission) is on, so silence costs almost nothing. Measure before turning on RED (redundant audio), which roughly doubles audio bandwidth.
- "Higher quality on Wi-Fi" is opt-in per listener and never the default. How it is delivered (a second, higher-bitrate track the listener subscribes to, or a higher-bitrate replay file) is decided in OP-23; whichever it is, the 32 kbps path stays the default.
- The data estimate shown to listeners (requirement 14) is computed from the actual bitrate with the shared `mbPerHour(kbps)` helper, rounded and labelled "about": "About 15 MB per hour".
- Replays are served at the same default bitrate as live.

## Recordings (requirements 19–23)

- **Every broadcast is recorded.** When a broadcast goes `live`, the server starts a LiveKit Egress (audio only, Ogg Opus, same bitrate) writing to R2 at `recordings/<preacher_id>/<broadcast_id>.ogg`, and creates the `recordings` row with `status = 'processing'`. Starting egress is idempotent per broadcast (one recording per broadcast, even after reconnects).
- A recording becomes `ready` only on LiveKit's `egress_ended` webhook with a completed status, which gives its duration and size. Then it appears on the preacher's profile. A failed egress marks it `failed`, keeps whatever file exists, and alerts the team (OP-41); it's never silently dropped.
- **Reliability (NFR):** a broadcast that ends normally never loses its recording. Ending stops egress and waits for `egress_ended`; nothing deletes the R2 object until the row says `deleted`.
- **Visibility:** `recordings.visibility` is `public`, `hidden_by_preacher` or `hidden_by_admin`. Hidden recordings are left out of every public list, search and share page, and their audio route refuses the public. The owner and admins can still see them. A preacher can unhide their own hiding, never an admin's.
- **Delete:** the owner (or an admin) deletes; the row moves to `deleted` first, then the R2 object is removed. Stats rows stay.
- **Free-tier limit (requirement 22):** keep the `FREE_RECORDING_LIMIT` (20) newest ready recordings per preacher. After a new recording becomes ready, the oldest beyond the limit are deleted as above. Hidden recordings count towards the limit. The preacher is told before going live when the next broadcast will push an old recording out.
- **Playback:** R2 objects are private. Audio is served through a route that checks visibility and supports HTTP Range requests (seek, requirement 21), or through a short-lived signed URL made after that check. Never a public bucket URL.
- **Share pages (requirement 23):** `/r/<recording id>` is a server-rendered page with Open Graph and Twitter tags (title, preacher name, photo) so WhatsApp shows a preview card. Hidden or deleted recordings return 404 with no preview.

## Following and go-live notifications (requirements 16–18)

- Following needs an account. A preacher can't follow themselves.
- When a broadcast goes `live`, followers get **one** web push: the preacher's name and the broadcast title, linking to the live player. The send is idempotent per broadcast (`notifications_sent` keyed by broadcast id), so a reconnect or a retried webhook doesn't notify again.
- Left out: followers who turned notifications off for that preacher (requirement 18), listeners the preacher blocked (requirement 27), and subscriptions the push service reported gone (404/410 → delete the subscription).
- Fan-out runs outside the request that marked the broadcast live, so going live never waits on push delivery.

## Blocking (requirement 27)

- A preacher can block a listener: the follow is removed in the same statement, the listener can't follow again, and gets no notifications from that preacher.
- Live listening and replays stay public, so blocking doesn't stop listening; it stops following and notifications.

## Trust and safety (requirements 24–26)

- **Terms and guidelines** are accepted at sign-up and stored with the version accepted (`users.terms_version`). OpenPulpit does not police doctrine; the rules cover hate speech, incitement to violence, harassment, fraud and solicitation scams, and illegal content. Don't add rules about belief.
- **Reports:** any signed-in user can report a live broadcast, a recording or a profile, with a reason from a fixed list plus optional text. One open report per reporter per target.
- **Admin actions** (end a live broadcast, hide a recording, warn, suspend or ban an account, approve verification): admin role checked on the server, the action applied, and an `audit_log` row written **in the same batch**: who, what, target, reason, when. No admin action without its audit row. `audit_log` is append-only: never updated or deleted, including in migrations.
- **Ending a live broadcast as admin** sets `ended_reason = 'admin'`, deletes the LiveKit room (which drops the preacher and listeners at once), stops recording, and makes the recording `hidden_by_admin`.
- **Suspended or banned** preachers: no new tokens; a live broadcast of theirs is ended with `admin`. Their public profile and recordings are hidden while suspended.
- Titles, descriptions, bios and report text are untrusted input: rendered as text, never HTML, and length-limited by Zod on the server.

## Stats (requirements 28–29)

- Live listener count (requirement 8) and peak live listeners (requirement 29) count subscribers only, never the preacher, from LiveKit participant events. Peak is stored on the broadcast when it ends.
- Replays count once per listener per recording per day, after a few seconds of playback (exact threshold decided in OP-39).
- Admin bandwidth and hours figures (requirement 28) come from stored totals, not computed from LiveKit on each page load.

## Webhooks

- `POST /api/webhooks/livekit` is public, so the LiveKit signature (`WebhookReceiver` with the API key and secret) is verified **before** anything else. Events are handled idempotently (LiveKit retries): every handler is safe to run twice.
- The broadcast is found from the room name (its id), never from anything else in the payload.

## When you change any of this

Change the policy function first, add or update its tests, then the route handler or webhook, then the UI. Never re-implement a rule in the client; the client only displays it. Update this skill in the same change.
