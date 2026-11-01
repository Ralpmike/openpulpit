---
colors:
  background: oklch(0.99 0.004 85)
  foreground: oklch(0.21 0.02 265)
  primary: oklch(0.42 0.13 262)
  primary-foreground: oklch(0.99 0.004 85)
  muted: oklch(0.955 0.008 85)
  muted-foreground: oklch(0.47 0.02 265)
  border: oklch(0.9 0.008 85)
  live: oklch(0.54 0.2 27)
  live-foreground: oklch(0.99 0 0)
  status-good: oklch(0.48 0.12 150)
  status-warning: oklch(0.52 0.12 65)
  status-danger: oklch(0.54 0.2 27)
typography:
  family: Geist (next/font, Latin subset, display swap)
  page-title: { size: 1.875rem, weight: 600, line-height: 1.2 }
  section-title: { size: 1.125rem, weight: 600, line-height: 1.4 }
  body: { size: 1rem, weight: 400, line-height: 1.5 }
  caption: { size: 0.875rem, weight: 400, line-height: 1.4 }
  numbers: { feature: tabular-nums }
  player-title: { size: 0.9375rem, weight: 600, line-height: 1.3 }
radius: 0.75rem
---

# OpenPulpit design

Tokens live in `src/app/globals.css`; this file explains them. Change both in the same commit (see the `design-md` skill).

## Overview

For preachers and listeners on mid-range Android phones, often outdoors in bright light, often older, always paying for data. The feel is warm, calm and trustworthy: a quiet page that puts the preacher and the sermon first. Mobile first at 360px; on wide screens the same single column sits centred (max width `xl`), and only the admin dashboard uses more width.

## Colours

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | warm off-white | deep blue-grey | Page |
| `foreground` | near-black blue | warm white | Text (17:1) |
| `primary` | deep blue | light blue | The one accent: main buttons, active nav, links, focus ring (8.4:1) |
| `muted` / `muted-foreground` | warm grey | — | Secondary text and surfaces (6.6:1 on background) |
| `live` / `live-foreground` | red, same in both themes | — | Only for "live": the Live badge and live player. Never decoration (5.5:1) |
| `status-good` | green | light green | Verified, ready, actioned (6:1) |
| `status-warning` | amber-brown | light amber | Hours running low, processing, pending (5.5:1) |
| `status-danger` | red | light red | Errors, hidden by admin, banned |

Contrast was measured for every pair above (WCAG 2.2 AA or better in both themes). Status is never colour alone: badges always carry a word.

The theme follows the phone's setting (`next-themes`, class strategy).

## Typography

One family, Geist, self-hosted through `next/font` with the Latin subset only. Headings use `text-balance`, paragraphs `text-pretty`. Anything numeric that changes (listener counts, elapsed time, hours left, durations) uses `tabular-nums`.

## Spacing, radius, elevation

- Tailwind's default spacing scale. Page gutter `px-4`; sections separated by `gap-6`.
- Radius `0.75rem` (`rounded-lg`); avatars are round; badges are pills.
- Elevation: borders first, Tailwind's default shadows only on floating surfaces (player bar, menus).
- Fixed chrome, bottom to top: bottom nav (`h-nav`, 4rem, `z-nav`), player bar (`h-player`, 4.5rem, `z-player`, `bottom-above-nav`), sticky header (`z-header`). Pages pad for them with `pb-chrome`, and fixed elements respect the safe area (`pb-safe`).
- Touch targets are at least 44px (`min-h-11`, `size-11`). The shadcn atoms are raised for phones: `Button` default `h-11`, `lg` `h-12`, `icon` `size-11`; `Input` and `Select` `h-11` with 16px text (no zoom on iOS); `Tabs` `h-11`.

## Components

| Pattern | Owner |
| --- | --- |
| App frame | `AppShell` (header, main column, player slot, `BottomNav`) |
| Live status | `LiveBadge` |
| Buttons that run something | `LoaderButton` |
| List placeholders | `SectionLoadingSkeleton`; page-level `LoadingOverlay` |
| Confirm / cancel | `DialogActionFooter` |
| Going live, ending, deleting, blocking, admin actions | shadcn `AlertDialog` |
| Statuses | `Badge` variants: `live`, `good`, `warning`, `destructive`, `secondary` |
| Persistent player | `PlayerBar` (OP-22) |
| App icon | Placeholder "OP" mark on primary (`public/icons/`). To decide: a real logo |

## Do and don't

- Do keep one accent per screen (primary). Live red appears only where something is live.
- Do show the preacher's name and photo prominently; they are what listeners recognise.
- Don't use gradients, glows or decorative images; every byte costs listeners data.
- Don't animate anything but `transform` and `opacity`; the live dot stops pulsing under reduced motion.
- Don't put text on photos.
