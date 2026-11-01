---
name: baseline-ui
description: The visual quality baseline for every OpenPulpit screen — Tailwind defaults, typography, mobile-first layout for phones on slow data, the player bar, z-index scale, colour restraint, confirmation dialogs for going live, ending and deleting, and animation rules. Use this for any UI work in src/app, src/components or src/modules, any polish or cleanup pass, whenever a screen "looks off" or "looks AI-generated", and whenever you add animation or transitions. Run `/baseline-ui <file>` to review a file against it.
---

# Baseline UI

These are OpenPulpit's always-on visual rules. For deeper work, use `better-ui` (surfaces, icons, motion), `better-typography`, `better-layout`, and `better-colors`. When they disagree with this file or `app/DESIGN.md`, this file and `DESIGN.md` win.

Adapted from ui-skills `baseline-ui` and `fixing-motion-performance` by ibelick (MIT), tuned for preachers and listeners on mid-range Android phones over slow, costly mobile data.

## How to use

- Apply these rules to all UI work.
- `/baseline-ui <file>`: review the file and list each violation (quote the line), why it matters (one sentence), and the fix.

## Stack

- Tailwind v4 defaults unless a theme token already exists in `src/app/globals.css`. No arbitrary values.
- `cn()` from `@/lib/utils` for class logic.
- Animation: plain Tailwind transitions first. Add Motion (`motion/react`, with `LazyMotion` and `m.*`) only when agreed, since every kilobyte costs listeners data; respect reduced motion either way. Follow the timings in `better-ui`.
- Brand: one accent colour (`primary`) and a separate `live` tone used only for live status; fonts, radius and the rest are recorded in `DESIGN.md` (OP-8). Until then, use shadcn defaults and leave values "To decide".

## Components

- Use the project's shadcn primitives (Radix base) for anything with keyboard or focus behaviour: dialogs, menus, tabs, selects. Never rebuild focus or keyboard handling by hand.
- Don't mix primitive libraries in one interaction.
- Icon-only buttons need an `aria-label` (see `accessibility`).

## Interaction

- Actions that go public, end something or can't be undone use `AlertDialog`: going live, ending a broadcast, deleting a recording, blocking a listener, every admin action. Say exactly what will happen ("End your broadcast? 214 people are listening. Your recording will be saved.").
- Loading uses structural skeletons that match the final layout (see `loading-and-errors`).
- Show errors next to where the action happened, not only in a toast.
- Never block paste in inputs. People paste one-time codes, links and Bible references.
- The Go live button is the biggest, clearest thing on the go-live screen; End broadcast is clear but never placed where it can be hit by accident.

## Layout

- Mobile first: design at 360px, then check tablet and laptop. Content sits in a readable centred column on wide screens; the admin dashboard may use the full width.
- Never `h-screen`; use `h-dvh` (mobile browser bars change the height).
- Fixed elements (bottom navigation, the player bar) respect `env(safe-area-inset-bottom)`, and page content is padded so nothing hides behind them.
- Touch targets are at least 44px (`size-11`), especially player controls.
- Wide tables (admin) scroll inside their own container, never the whole page sideways.
- Our own fixed elements (bottom nav, player bar, sticky header) use a small z-index scale defined once in the theme. No arbitrary `z-[999]`. Never set z-index on shadcn dialogs, sheets, or popovers; they stack themselves.
- `size-*` for square elements instead of `w-*` + `h-*`.

## Typography

- `text-balance` on headings, `text-pretty` on paragraphs.
- `tabular-nums` on anything numeric that changes or lines up: listener counts, elapsed time, hours left, durations, stats.
- `truncate` or `line-clamp-*` in dense lists (sermon titles, ministry names).
- Don't change letter spacing (`tracking-*`) unless asked.

## Design restraint

- No gradients, purple gradients, or glow effects unless asked.
- One accent colour per screen (`primary`). The `live` tone and status colours (good, warning, danger) are not accents and are always paired with text.
- Tailwind's default shadow scale unless the theme defines its own.
- Every empty state has exactly one clear next action ("Browse recent sermons").

## Animation

- Don't add animation unless asked or it explains a change (going live, a new broadcast appearing in Live now).
- Animate only `transform` and `opacity`. Never width, height, top, left, margin, or padding.
- Interaction feedback stays under 200ms; entrances use `ease-out`.
- Respect `prefers-reduced-motion`.
- No `blur()` or `backdrop-filter` on large surfaces, and never animate them.
- No `will-change` outside an active animation.
- Never drive animation from scroll events; use `IntersectionObserver` or CSS scroll timelines.

## Performance

- Don't use `useEffect` for anything that can be computed during render.
- Keep the first load light: every dependency and font weight is paid for in listeners' data (see `frontend-performance`).
