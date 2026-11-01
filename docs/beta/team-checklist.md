# Beta: team checklist

## Before the first invite

- [ ] Staging works end to end on a real Android phone on mobile data (`weekly-ship` real-world check): go live, listen from a second phone, drop data for 20 s, lock screen, notification, recording, replay at 2x, WhatsApp preview.
- [ ] Production is set up: Cloudflare (D1, R2, secrets), LiveKit Cloud project with webhook and Egress to R2, Resend sending domain, Google sign-in, VAPID keys, `CRON_SECRET`, `ALERT_EMAIL`, cost limits.
- [ ] At least one admin account (role set to `admin` in D1) who can review reports, applications and badge requests.
- [ ] The guidelines and terms read well to a pastor (and, if possible, to a lawyer).
- [ ] A team WhatsApp group for beta preachers, and one named person who answers within an hour during broadcast times (Sunday mornings, midweek evenings).

## For each preacher

- [ ] Invite sent and accepted ([invite-messages.md](invite-messages.md))
- [ ] Onboarding call done: account, profile, photo, test broadcast ([preacher-guide.md](preacher-guide.md))
- [ ] Verified badge decided (Admin → Reviews)
- [ ] First real broadcast watched live by the team
- [ ] Week 2 feedback call
- [ ] Week 4 feedback call

## Every week

- [ ] Admin → Reports: nothing waiting more than a day
- [ ] Admin → Stats: broadcasts, listen hours, bandwidth; no failed recordings
- [ ] LiveKit Cloud usage and Cloudflare bills against the budget
- [ ] Bugs and requests filed as GitHub issues with the `epic:beta` label
