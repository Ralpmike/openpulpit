---
name: component-canvas
description: Build or update a development-only canvas page in OpenPulpit that shows the atoms and molecules with all their variants and states side by side, in light and dark, at phone and laptop width. Use this whenever the person wants to see all components, check consistency across variants, preview a new molecule, or set up a component playground or style guide.
---

# Component canvas

Adapted from ui-skills `component-canvas` by ibelick (MIT).

A single page that shows every shared component as it really behaves, so design drift is easy to spot.

For a single component, use the user-invoked skills instead: `state-machine` (every state with a switcher), `break` (stress test with long names, empty data, bad input), `variant` (try several designs and pick one).

## Ground rules

- The canvas wraps components; it never changes them. Components must not import canvas code.
- Development only: lives at `src/app/(dev)/canvas/page.tsx`, which calls `notFound()` unless `process.env.NODE_ENV === 'development'`, so it never serves in production.
- Show only the components asked for. Ask before adding a dependency.
- Sample data comes from `src/test/fixtures/`, with realistic data: Nigerian preachers and ministries ("Pastor Adebayo Ogunleye, Living Word Chapel, Ibadan"), Bible references, real-looking sermon titles, and long names ("The Redeemed Christian Church of God, Jesus House Parish, Port Harcourt, Rivers").

## Build order

1. One group with one component. Confirm it renders.
2. Add the remaining groups (atoms, then molecules).
3. Add variants and states, one at a time.

## Layout

- Plain background, groups with equal padding, a thin dashed border in a muted colour, and a plain title above each group.
- A toggle for light and dark using the existing theme setup. Don't invent themes.
- A toggle for phone width (360px) and laptop width (1280px), phone first, since that's where most people listen.
- No decorative extras: no background dots, banners, or editing tools.

## Variants

Show every real variant and useful state from each component's props: sizes, `cva` variants, disabled, loading, error, empty, long text (long organisation names, long subjects), and the status tones (live, verified, hidden, processing, report status), plus the player in each state (connecting, live, reconnecting, ended, replay at 1x/1.5x/2x). Don't invent variants a component doesn't support.
