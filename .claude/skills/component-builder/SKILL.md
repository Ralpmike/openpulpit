---
name: component-builder
description: How to build and organize UI components in OpenPulpit (Next.js App Router) — server vs client components, atoms, molecules, module components and partials, when to split or promote, naming, data-testid, dialogs, the persistent audio player, and mobile-first layout for phones on slow data. Use this whenever you create, change, move, or review anything in src/components, src/modules/*/components or src/app, even a small tweak to a button or screen.
---

# Component builder

## Before writing any component

1. Check `@/components/ui/atoms/` and `@/components/ui/molecules/` for something that already does the job. Compose it; don't duplicate it.
2. Check the shadcn/ui registry for a primitive that covers it (`npx shadcn@latest search`, or the shadcn MCP). Add it with `npx shadcn@latest add <name>` rather than writing one by hand (`components.json` points the `ui` alias at `@/components/ui/atoms`). Follow the `shadcn` skill for how each component must be composed.
3. If a Figma link or node id was given, follow the `figma-to-code` skill first.

## Server or client

- Components are **server components by default**. Add `'use client'` only to the smallest leaf that needs state, effects, browser APIs, RTK Query hooks, LiveKit or audio.
- Pages in `src/app/` are server components that read public data through module services (profiles, share pages, home page shells) and render client islands for interaction. This keeps first load small on 3G (PRD: under 3 seconds).
- Never import `server-only` code (`modules/*/server`, `lib/*`) into a client component. Pass data down as serialisable props.

## Where things go

`@/` is `src/`.

```
app/                      # routes: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
components/
  ui/
    atoms/                # shadcn/ui primitives (button.tsx, dialog.tsx, sheet.tsx); no business logic
    molecules/            # reusable combinations: LoaderButton, LoadingOverlay, SectionLoadingSkeleton,
                          # StatusDialog, DialogActionFooter, FormFieldInput, LiveBadge, DataUseNote
      __tests__/
  layout/                 # AppShell, BottomNav, Header (used by app/ layouts)
modules/
  <module>/               # accounts, broadcasting, library, social, moderation, admin
    components/
      GoLivePage.tsx
      MicCheck.tsx
      partials/           # pieces used only by this module
    __tests__/            # tests for everything in this module, including partials
  player/                 # the persistent player (client): PlayerBar, LivePlayer, ReplayPlayer
```

## The player

- One player lives in the root layout and survives navigation (a listener keeps hearing the sermon while browsing). Pages ask it to play through the `player` slice (`hooks-and-helpers`); they never create their own `<audio>` or LiveKit room for listening.
- It sets Media Session metadata (preacher, title, artwork) and handlers so lock-screen controls work (requirement 12).

## Promote to a molecule only when all three hold

1. It's built from atoms (shadcn primitives, icons), not from a generated RTK Query hook, the store, or LiveKit.
2. It's used at least twice, or clearly belongs in the design system (inputs, dialogs, status badges, preacher cards).
3. It has a stable, typed props API and `data-testid` on its root.

Molecules never fetch data or touch the Redux store. Data comes from server components or RTK Query hooks in module components, passed down as props.

## Split a component when

- A file has more than one job.
- The same JSX block appears twice or more.
- Testing it alone would be much easier.

Keep it inline when it's one-off glue under about 30 lines with no second user. Move pure logic (no hooks, no JSX, no side effects) to `helpers/<domain>/` (see `hooks-and-helpers`).

## Naming

- Component files and exports: PascalCase (`PreacherCard.tsx`, `export function PreacherCard`). Exceptions: shadcn atoms keep the CLI's kebab-case names (`button.tsx`), and Next.js route files keep their reserved names (`page.tsx`, `layout.tsx`).
- Edit a shadcn atom only for project-wide changes (e.g. a new variant). One-off changes belong in a molecule or a `className` passed through `cn()`.
- Booleans read as a full English predicate with `is`, `has`, `show`, or `can`: `isLive`, `hasMicPermission`, `canGoLive`. Never abbreviations, bare words (`live`, `loading`), or number suffixes.
- Toggle handlers are named after the thing toggled: `toggleShowTranscript`. A one-line inline `() => setIsOpen(v => !v)` is fine.
- Always import with `@/`, never relative paths that cross folders.

## Required on every component

- `data-testid` on the root element of every interactive component, in kebab-case: `go-live-button`, `follow-button`, `player-bar`.
- Props typed with an interface named `<Component>Props`. No `React.FC`.
- Tailwind theme tokens for color, spacing, radius, and type (`bg-primary`, `text-muted-foreground`, `rounded-lg`), defined as CSS variables in `src/app/globals.css`. No raw hex values and no arbitrary values like `p-[13px]` or `bg-[#111]`.
- Merge classes with `cn()` from `@/lib/utils`; accept a `className` prop on molecules for overrides.
- Variants (sizes, status tones) use `cva`, not chains of conditionals.
- Use `flex` + `gap-*`, never `space-x-*` / `space-y-*`.
- Statuses (live, verified, recording processing, hidden, report status) use `Badge` variants with a word, not colour alone; callouts (hours nearly used, reconnecting) use `Alert`; dividers use `Separator`.
- Icons inside buttons use `data-icon="inline-start"` / `"inline-end"`, with no size classes.
- `Dialog`, `Sheet`, and `Drawer` always have a title (`sr-only` if it shouldn't show).
- Images use `next/image` with explicit width and height and real `alt` text (a preacher's name), sized for phones.

## Layout

- **Mobile first.** Design at 360px first: one column, a bottom navigation, the player bar fixed above it. Then check tablet and laptop widths (a centred column, the admin dashboard uses more width).
- Wide content (admin tables) scrolls inside its own container, never the whole page sideways.
- Details and secondary forms open in a `Drawer` from the bottom on phones and a `Sheet` on laptops.

## Dialogs

| Need | Use |
| --- | --- |
| Success or milestone (icon, title, 1–2 lines, up to 2 buttons), e.g. "You're live" | `StatusDialog` molecule |
| Confirm or cancel, e.g. "Unfollow Pastor Ade?" | `DialogActionFooter` molecule |
| Goes public, ends something or can't be undone: go live, end broadcast, delete a recording, block a listener, any admin action | shadcn `AlertDialog` |
| Longer content (broadcast details, report form) | shadcn `Drawer` (phone) or `Sheet` (laptop) |

`DialogActionFooter`: secondary (outline `Button`) on the left, primary (`LoaderButton`) on the right, side by side with `justify-between`. On phones a single stacked call to action may be full width, with a comment saying why.

Don't rebuild these shells with raw shadcn `Dialog` markup in a module. Compose the molecule and pass props; a domain wrapper (e.g. `EndBroadcastDialog`) should only wire callbacks.

## Images and icons

- Icons: `lucide-react`, imported per icon. No asset file needed.
- Logos and illustrations: check `public/` first to avoid duplicates, save as `public/icons/<kebab-name>.svg` (prefer `currentColor` for single-colour art), with explicit width, height, and alt.
- Never put temporary Figma asset URLs in code.

## Related skills

- `baseline-ui`: visual quality rules (typography, layout, animation).
- `accessibility`: names, focus, live updates, colour, audio controls.
- `loading-and-errors`: spinners, skeletons, empty states, and toasts.
- `design-md`: update `DESIGN.md` when you add or change a token.
- `broadcasting-rules`: what the UI must never let happen (going live without hours, showing hidden recordings, etc.).
