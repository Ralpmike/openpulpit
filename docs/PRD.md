# OpenPulpit — Product Requirements Document

Owner: Raphael (FutureLabs) · Lead engineer: Claude · Status: Draft v1 · Date: 1 November 2026

## 1. Summary

OpenPulpit is a web platform where preachers go live with audio from their phone or laptop and reach listeners directly, without needing a radio station's approval or airtime. Every broadcast is saved so listeners can replay it later. We launch in Nigeria, free for preachers, with video and native mobile apps to follow.

## 2. Problem

- Many preachers cannot get onto radio: airtime is expensive, stations are far away, and some stations refuse preachers whose message doesn't match the station's own beliefs.
- Existing options (Facebook Live, YouTube, WhatsApp voice notes) are built for video or general social media, not for sermons, and they use a lot of mobile data.
- Listeners have no single place to follow the preachers they trust and get told when they go live.

## 3. Goals

- A preacher can sign up and be live within five minutes, using only a phone browser.
- Listening is cheap on mobile data: low-bitrate audio that still sounds clear.
- Listeners never miss a broadcast: follow, get notified, replay.
- An open platform with clear, fair ground rules, so it's free to preach but safe to use.

## 4. Users and roles

- **Preacher:** creates a profile, goes live, manages recordings.
- **Listener:** browses, follows preachers, listens live or on replay. Can listen without an account; an account is needed to follow, get notifications and report.
- **Admin (FutureLabs):** verifies preachers, reviews reports, removes content or suspends accounts.

## 5. Requirements (MVP)

Requirements are numbered so tickets and pull requests can reference them.

### Accounts and profiles

1. Sign up and log in with email and password, email one-time code, or Google.
2. Choose a role at sign-up: preacher or listener. A listener can apply to become a preacher later.
3. Preacher profile: name, photo, short bio, ministry or church name, location (state and city), denomination (optional), and a public profile link.
4. Preacher verification: a preacher can request a "verified" badge, which an admin approves.
5. Listener profile: name, photo (optional), followed preachers.

### Going live

6. A preacher can go live with audio from the browser in one tap, with a mic check before starting.
7. Each broadcast has a title, an optional description and an optional Bible passage reference.
8. The preacher sees a live listener count and elapsed time while broadcasting.
9. Broadcasts survive brief network drops: the preacher's client reconnects automatically, and listeners hear the stream resume.
10. Free tier limit: a cap on monthly broadcast hours (initial value 10 hours, configurable). The preacher sees their remaining hours before going live.

### Listening

11. Home page shows who is live now, then recent broadcasts, then suggested preachers.
12. The live player keeps playing in the background on phones and shows the preacher and title on the lock screen (Media Session API).
13. Audio is streamed at a data-friendly bitrate (target around 32 kbps Opus), with the option of higher quality on Wi-Fi.
14. Listeners can see roughly how much data an hour of listening uses.
15. Search preachers by name, ministry, location or denomination.

### Following and notifications

16. A listener can follow or unfollow a preacher.
17. Followers get a web push notification when a followed preacher goes live.
18. Followers can turn notifications off per preacher.

### Recordings and replay

19. Every broadcast is recorded automatically and appears on the preacher's profile when it ends.
20. A preacher can rename, edit the description of, hide or delete a recording.
21. Listeners can replay recordings with seek, 1.5x and 2x speed, and resume where they stopped.
22. Free tier keeps the 20 most recent recordings per preacher (configurable).
23. Each recording has a shareable link that opens a player page with a preview card for WhatsApp and social media.

### Trust and safety

24. Terms of use and community guidelines, accepted at sign-up. OpenPulpit does not police doctrine; the rules cover hate speech, incitement to violence, harassment, fraud and solicitation scams, and illegal content.
25. Any logged-in listener can report a live broadcast, a recording or a profile, with a reason.
26. Admin dashboard: queue of reports, ability to end a live broadcast, hide a recording, and warn, suspend or ban an account. Every admin action is logged.
27. A preacher can block a listener from following them.

### Platform

28. Admin can view basic platform stats: preachers, listeners, broadcasts, hours streamed and total bandwidth.
29. Preachers can see basic stats per broadcast: peak live listeners, total replays.
30. The web app is installable as a PWA (home-screen icon, app-like feel) before native apps exist.

## 6. Non-functional requirements

- **Performance:** first load under 3 seconds on a mid-range Android phone on 3G. Listening starts within 3 seconds of tapping play.
- **Data use:** default live and replay audio under about 15 MB per hour.
- **Scale (MVP target):** 50 simultaneous live broadcasts and 2,000 simultaneous listeners.
- **Reliability:** recordings are never lost if a broadcast ends normally.
- **Accessibility:** WCAG 2.2 AA, following the better-accessibility skill.
- **Security:** role checks on every API route; preachers can only manage their own broadcasts and recordings.
- **Privacy:** compliant with the Nigeria Data Protection Act 2023; minimal personal data collected.

## 7. Technical approach

- **Frontend:** Next.js (App Router) with TypeScript, Tailwind, shadcn/ui, lucide-react.
- **State and data:** Redux Toolkit with RTK Query; react-hook-form with Zod for forms.
- **Hosting:** Cloudflare, using the OpenNext adapter for Next.js.
- **Database:** Cloudflare D1, with numbered migrations (following the d1-schema skill).
- **Recordings storage:** Cloudflare R2.
- **Live audio:** LiveKit (WebRTC). It handles going live from the browser, delivery to listeners, and recording to R2, and it supports video for later.
- **Auth:** Better Auth on D1.
- **Notifications:** Web Push now, then Expo notifications with React Native.
- **Architecture:** a modular monolith, organised into modules: accounts, broadcasting, library (recordings), social (follows and notifications), moderation and admin.
- **Skills:** the FutureLabs skills from the Outreach repo, adapted for Next.js. outreach-rules is replaced by a new broadcasting-rules skill.

## 8. Business model

- **Launch:** free for preachers, within limits (requirements 10 and 22).
- **Later, premium for preachers:** unlimited hours and storage, scheduled broadcasts, deeper analytics, custom profile link.
- **Later, listener giving:** listeners send offerings or tips to preachers through Paystack or Flutterwave, with OpenPulpit taking a small platform fee.

## 9. Launch market

Nigeria first: a strong preaching culture, the team is local, and a beta with real preachers is easy to run. The product is built in English, so it can open globally without a rebuild.

## 10. Success metrics

- 100 active preachers within three months of public launch.
- 40% of preachers broadcast at least twice a month.
- Average live audience per broadcast of 15 or more.
- 30% of listeners who follow someone return in the following week.
- Cost per streamed hour stays within budget (target set during beta).

## 11. Phases

1. **Discovery:** confirm requirements with 5–10 preachers.
2. **Design:** wireframes for the key screens, and the data model.
3. **Foundation:** repo, Cloudflare setup, auth, CI/CD, adapted skills.
4. **Core MVP:** requirements 1–23.
5. **Trust and safety:** requirements 24–29.
6. **Private beta:** 5–10 preachers in Nigeria; requirement 30 and fixes.
7. **Public launch**, then React Native apps, then video.

## 12. Not now

These are deliberately out of scope for the MVP:

- Video broadcasts.
- Native iOS and Android apps (the PWA covers this first).
- Payments, giving and premium plans.
- Live chat or comments during broadcasts.
- Co-hosts, call-ins or multiple speakers.
- Scheduled broadcasts and calendars.
- Languages other than English in the interface.
- Music licensing support (preachers are told not to play copyrighted music).

## 13. Risks

- **Streaming cost:** a few big audiences on the free tier could push up the bandwidth bill. Mitigation: hour caps, low default bitrate, cost monitoring from day one.
- **Harmful content:** an open platform can attract abuse or scams. Mitigation: guidelines, reporting, a fast admin response, verification badges.
- **Copyright:** preachers playing worship music on air. Mitigation: guidelines, and the ability to remove recordings.
- **Patchy networks:** dropped connections mid-sermon. Mitigation: automatic reconnects (requirement 9).

## 14. Open questions

- Should listening require an account, or stay open to anyone?
- What is the exact free-tier cap on hours and recordings after beta cost data?
- Do we verify preachers by ID, church reference or another method?
- Should content guidelines be reviewed by a lawyer before launch?
