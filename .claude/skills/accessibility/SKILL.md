---
name: accessibility
description: Accessibility rules for OpenPulpit — accessible names, keyboard and focus, dialogs, form errors, audio player controls, live announcements for going live, reconnecting and listener counts, contrast in sunlight, and not relying on colour alone. Use this whenever you add or change buttons, links, inputs, dialogs, menus, tabs, tables, forms, icon-only controls, the player, or anything that updates live, and when reviewing a screen. Run `/accessibility <file>` to audit a file.
---

# Accessibility

These are OpenPulpit's always-on accessibility rules. The target is WCAG 2.2 AA (PRD NFR "Accessibility"); for a full audit, use `better-accessibility`.

Adapted from ui-skills `fixing-accessibility` by ibelick (MIT).

Listeners and preachers use phones, often outdoors in bright light, often older people and people with low vision. An audio product must work fully without looking at the screen and with a screen reader.

## How to use

- Apply these rules to all UI work.
- `/accessibility <file>`: list each violation (quote the snippet), why it matters, and the smallest fix. Fix critical items first. Don't rewrite unrelated code or switch UI libraries.

## 1. Names (critical)

- Every interactive control has an accessible name.
- Icon-only buttons have `aria-label` ("Play", "Pause", "Skip back 15 seconds", "Playback speed 1.5x", "Follow Pastor Ade"); their icons are `aria-hidden`. Toggle buttons use `aria-pressed` (follow, notifications on).
- Every input has a visible label. Placeholders are not labels.
- Links say where they go ("Pastor Ade's profile"). No "click here".
- Buttons that go public or end something say exactly what happens: "Go live", "End broadcast", "Delete recording", not "OK".

## 2. Keyboard and focus (critical)

- Never use a `div` or `span` as a button. Clickable cards (a preacher, a recording) have a real link or button inside.
- Everything is reachable by Tab with a visible focus ring. Never remove outlines without a replacement.
- No `tabindex` above 0.
- Dialogs, sheets and drawers trap focus, set initial focus inside, close on Escape, and return focus to the trigger. shadcn/Radix does this; don't break it.
- The player: Space toggles play when the player has focus; the seek bar is a real slider (`role="slider"` from shadcn `Slider`) with arrow-key steps of 15 seconds and `aria-valuetext` in words ("12 minutes 30 seconds of 45 minutes").

## 3. Semantics (high)

- Native elements first (`button`, `a`, `input`, `table`, `audio`); add ARIA only when native elements can't do it.
- Lists (live now, recordings, followers, reports) use `ul`/`ol` with `li`; admin data uses a real `table` with `th` headers.
- Don't skip heading levels. Each page has one `h1`.
- Landmarks: one `header`, `nav` (bottom navigation), `main`, and the player bar as a labelled `region` ("Now playing").

## 4. Forms and errors (high)

- Errors are linked to their field with `aria-describedby`, and the field gets `aria-invalid`. shadcn `Field` + `FieldError` does this when wired through react-hook-form's `Controller`.
- Required fields are announced.
- A disabled button explains why nearby ("No broadcast hours left this month", "Allow microphone access to go live").
- One-time codes use `autoComplete="one-time-code"` and accept paste.

## 5. Live updates (high for OpenPulpit)

- Going live, ended, and "Reconnecting…" / "Reconnected" are announced in a polite live region (`aria-live="polite"`).
- The listener count and elapsed time are **not** announced on every change; they sit outside the live region. Announce only milestones the preacher needs ("10 minutes of broadcast time left").
- Loading regions use `aria-busy` or status text.
- Toasts are never the only place critical information appears. A refused go-live or a failed save also shows inline.
- Expandable controls use `aria-expanded` and `aria-controls`.

## 6. Colour and contrast (medium)

- Text and icons meet WCAG AA contrast in both light and dark themes; aim higher for the player and Go live (phones in sunlight).
- Never rely on colour alone. Live, verified, hidden and report status use a word or icon as well as colour (a red dot plus "LIVE").
- Disabled states don't rely on colour alone.
- Hover-only interactions have a tap or keyboard equivalent. Phones have no hover.

## 7. Audio, media and motion (medium)

- Audio never starts on its own; playback starts only from a tap (also required by mobile browsers).
- Player controls are at least 44×44px, with space between them, so they work one-handed.
- Lock-screen controls (Media Session) mirror the in-page controls.
- Images have meaningful `alt` text (the preacher's name), or empty `alt` if decorative.
- Respect `prefers-reduced-motion`; a live "pulse" dot stops pulsing under it.
- Transcripts and captions are out of scope for the MVP; don't promise them in copy.
