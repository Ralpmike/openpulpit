---
name: figma-to-code
description: The step-by-step workflow for turning a Figma design into OpenPulpit UI using the Figma connector — extract structure, tokens, and screenshots first, write a small spec, build with fixtures, check against the screenshot, and only then wire the API hooks. Use this whenever a Figma link, file, frame, or node id is mentioned, or the person asks to build a screen "from the design".
---

# Figma to code

Don't build UI from memory when a Figma link exists. Extract first, then build.

## Order

1. **Parse the link** into `fileKey` and `nodeId` (`521-110443` → `521:110443`).
2. **Metadata** (`get_metadata`): list child frames and repeated rows.
3. **Design context** (`get_design_context`) per frame you'll ship: copy, styles, assets.
4. **Variables** (`get_variable_defs`): colours, spacing, radius, type. Map each one to a Tailwind theme token (CSS variables in `src/app/globals.css`). If a value has no token, stop and ask whether to add one rather than using an arbitrary value.
5. **Reuse check:** before creating any new atom or molecule, search the design system (`get_libraries`, `search_design_system`) and `@/components/ui/`.
6. **Screenshot** (`get_screenshot`) of each frame, for checking later.
7. **Spec:** write `docs/figma-specs/<feature>-<nodeId>.json` with the frame name, copy, data-testids, token mapping, empty-state copy, and the reuse plan.
8. **Build the UI** with fixtures from `@/test/fixtures/`, following `component-builder`.
9. **Empty state:** build it. Never skip it.
10. **Check** against the screenshot: spacing, sizes, type, colours, states. Fix before moving on.
11. **Wire data last:** RTK Query endpoints in the module's `store/endpoints.ts` and their generated hooks only after the UI matches.

## Rules

- Don't invent colours, spacing, radii, shadows, or font sizes. Use extracted values mapped to tokens.
- Don't silently simplify the layout structure.
- Never commit temporary Figma asset URLs. Save assets under `public/` (see `component-builder`).
- OpenPulpit is mobile first; if a design has only a phone frame, ask before guessing the laptop layout, and if it has only a desktop frame, stop and ask for the phone one.
- Public pages get their data from server components (see `component-builder`); wire client hooks only for interactive parts.
- A one-line comment pointing to the Figma node is fine on non-obvious mappings.
