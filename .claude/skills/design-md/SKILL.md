---
name: design-md
description: Keep OpenPulpit's DESIGN.md — the single written source for colours, type, spacing, radius, and visual decisions — in step with the theme in src/app/globals.css. Use this whenever a colour, font, spacing, radius, or shadow token is added or changed, a brand or visual decision is made, or the person asks about the design system or how something should look.
---

# DESIGN.md

Inspired by ui-skills `create-design-md` by ibelick (MIT).

`DESIGN.md` (repo root, created in OP-8) records the design language so every session builds screens the same way. `src/app/globals.css` holds the actual token values; DESIGN.md explains them.

## Rules

- Record decisions, not every value that happens to exist. A one-off style in one component is not a token.
- Only add a token after it's defined in `globals.css` and used by a shared component or approved by the person. Never invent values to fill gaps; leave "To decide" instead.
- Tokens are named by role (`primary`, `muted-foreground`, `live`, `status-good`, `status-warning`, `status-danger`), matching the shadcn CSS variable names.
- When a token changes in `globals.css`, update DESIGN.md in the same change, and vice versa.
- Keep the front matter flat: colours as `role: value`, typography as a mapping per role (font family, size, weight, line height).

## Sections

1. **Overview:** who it's for and the feel (warm, trustworthy, calm; built for phones in bright light and for older eyes; light on data).
2. **Colours:** roles for light and dark themes, plus the `live` tone and the status tones used for verified, hidden, recording processing and report status.
3. **Typography:** families and the type scale by role (page title, section title, body, caption, numbers, player title).
4. **Spacing, radius, elevation:** the scales in use.
5. **Components:** which molecules own which patterns (PlayerBar, PreacherCard, RecordingCard, LiveBadge, StatusDialog, DialogActionFooter, LoaderButton, LoadingOverlay).
6. **Do and don't:** short visual rules (from `baseline-ui`) specific to OpenPulpit.

## Choosing values

- Palette and colour tokens: use `better-colors` to generate the palette and check contrast.
- Font and type scale: use `better-typography`.
- Applying the result to shadcn (CSS variables, presets): use the `shadcn` skill.

Record the decision here once the person approves it.

## When asked to update it

Read `globals.css`, `components/ui/`, and the current DESIGN.md first. Change only DESIGN.md unless asked to change the theme too. Report what was added, changed, or left as "To decide".
