# Private beta (OP-42)

Goal: 5–10 preachers in Nigeria preach live on OpenPulpit for four weeks, and we learn whether it works for them and their listeners before public launch (PRD §11, phase 6).

## Who to invite

A mix, so we see the real range of conditions:

| Mix | Why |
| --- | --- |
| 2–3 in Lagos or Abuja, 3–4 outside big cities (e.g. Ibadan, Enugu, Kaduna, Jos), 1–2 rural | Network quality varies most by place |
| Mostly Android phones, at least 1 preacher with an iPhone | Background audio and notifications differ |
| Pentecostal, Anglican/Catholic, evangelical, independent | We don't police doctrine; the product must suit everyone |
| At least 2 who already preach on radio, WhatsApp or Facebook | They can compare |
| Each with 20+ people who will actually listen | Live audience is a success metric |

## Timeline

| Week | What happens |
| --- | --- |
| 0 | Invite (see [invite-messages.md](invite-messages.md)), confirm, add each to the team WhatsApp group |
| 1 | 20-minute call per preacher: sign up together, profile, photo, mic check, a 5-minute test broadcast (use the [preacher guide](preacher-guide.md)) |
| 1–4 | Each preaches at least twice a week; the team watches the first broadcast of each preacher live |
| 2 and 4 | Feedback calls ([feedback-questions.md](feedback-questions.md)) and a short listener survey |
| 5 | Beta report: numbers below, what broke, what to fix before launch |

## What we measure (from the PRD's success metrics)

| Measure | Target in beta | Where to find it |
| --- | --- | --- |
| Time from sign-up to first live broadcast | Under 5 minutes | Ask during onboarding; account and broadcast timestamps |
| Preachers broadcasting at least twice a month | 40%+ (aim for all) | Admin → Stats, per-preacher broadcasts |
| Average live audience per broadcast | 15+ | Peak listeners on each sermon (Your sermons) |
| Followers who come back the next week | 30%+ | Follows and replays |
| Data used per hour of listening | About 15 MB | Listeners' phone data settings during feedback calls |
| Broadcasts that survive a network drop | All | Ask preachers; ended reasons in the database (`disconnected`) |
| Recordings lost | None | Admin → Stats, failed recordings alert |
| Cost per streamed hour | Set the budget from this | LiveKit Cloud usage + Admin → Stats |

## Open questions to settle in beta (PRD §14)

- Should listening need an account? (Today it doesn't.)
- What should the free-tier hour and recording caps be after we see real costs? (Today 10 hours a month, 20 recordings; both are settings.)
- How do we verify preachers: ID, church reference, or something else?
- Do the community guidelines need a lawyer's review before launch?

See also the [team checklist](team-checklist.md).
