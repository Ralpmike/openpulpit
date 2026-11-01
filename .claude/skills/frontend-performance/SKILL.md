---
name: frontend-performance
description: Frontend performance for OpenPulpit (Next.js App Router on Cloudflare via OpenNext) on mid-range Android phones over slow, costly Nigerian mobile data — first load under 3 seconds on 3G, play within 3 seconds, server vs client components, bundle size, fonts and images, request waterfalls, caching, audio data use, and Core Web Vitals. Use when a screen feels slow, adding a dependency or media asset, optimizing a page, or setting up performance checks.
---

# Frontend performance

Optimize measured user experience, not code for its own sake. The PRD sets the bar: **first load under 3 seconds on a mid-range Android phone on 3G, and listening starts within 3 seconds of tapping play.** Every kilobyte also costs the listener money. Follow `baseline-ui`, `loading-and-errors`, `cloudflare-nextjs`, `broadcasting-rules` and `testing` for their concerns.

## Measure first

- Identify the affected page, device class, network conditions, and user-visible delay before changing code.
- Measure production builds (`npm run build && npm run preview`, or the deployed Worker); `next dev` is not representative.
- Test with Chrome DevTools' 3G throttling and 4× CPU slowdown, or Lighthouse mobile. Record before/after: LCP, INP, CLS, transferred bytes, JS bytes, request count, time to first audio. State when a measurement is unavailable instead of claiming an improvement.
- Use existing project tooling first. Add an analyzer (`@next/bundle-analyzer`), monitoring SDK, or budget only when agreed.

## Keep the first screen light

- Server components by default; `'use client'` only on small interactive leaves. Public pages (home, profiles, share pages) render on the server with their data, so they show content before any JS runs.
- Check the build output's First Load JS per route before adding packages. Avoid a large library for a small interaction. Load heavy, non-critical parts with `next/dynamic` (the mic meter, the admin dashboard, charts).
- **`livekit-client` loads only when needed:** dynamically imported when someone taps Play on a live broadcast or opens the go-live screen, never in the shared layout bundle. Replays use a plain `<audio>` element and don't need it.
- Never import server code (`modules/*/server`, `lib/`, `livekit-server-sdk`) into client components; `server-only` enforces this.
- Images go through `next/image` (with a Cloudflare-compatible loader) at the size shown, as WebP or AVIF. Avatars are small. No decorative images on data-heavy screens.
- Icons from `lucide-react`, imported per icon.
- Fonts with `next/font`, self-hosted, only the weights and subsets used (Latin), `display: swap`. Prefer one family.

## Fast to play

- Tapping Play on a live broadcast: fetch the listen token and import `livekit-client` in parallel, and preconnect to the LiveKit host on pages that show live broadcasts.
- Replays: `preload="metadata"` only (never download a sermon before Play), served with Range support so seeking doesn't re-download.
- Show "Connecting…" at once; never a frozen button.

## Protect responsiveness on slow data

- Look for request waterfalls and duplicated reads. Server components fetch in parallel (`Promise.all`); API routes return only needed columns; long lists (recordings, admin queues) are paginated.
- Cache public, non-personal data at the edge where safe (a preacher's public profile, a share page) with short revalidation; never cache anything per-user.
- RTK Query's cache and tags are the single source of client server-data: one `createApi`, `keepUnusedDataFor` and tag invalidation instead of manual refetching. Don't add aggressive retries on unreliable connections. Polling (the live-now list) uses `pollingInterval` of 30 seconds or slower with `skipPollingIfUnfocused`; the preacher's own listener count comes from LiveKit events, not polling.
- Use `selectFromResult` when a component needs only part of a large query result.
- Keep showing the last loaded data when a refresh fails; don't swap back to a skeleton.
- One LiveKit connection at a time per tab; close it on unmount or when playback switches.
- Keep layout stable while data loads: structural skeletons and `tabular-nums` on changing numbers.

## Audio is the biggest cost

- The default stream stays at about 32 kbps Opus (under 15 MB an hour, see `broadcasting-rules`). Never raise it for a "better" score.
- The service worker (PWA, OP-40) caches the app shell and static assets, never audio streams.

## Rendering and interaction

- Avoid repeated expensive work in render paths and long synchronous tasks. Profile before adding memoization.
- Don't add animation as a performance garnish. Follow `baseline-ui`: animate only `transform` and `opacity`, respect reduced motion.
- Don't trade correctness, accessibility, readable content, or moderation safety for a faster synthetic score.

## Verification

- Re-test the affected page at 360px with throttled network and CPU. Check for layout shifts, blocked controls, repeated requests, a useful loading state, and time to first audio.
- For user-facing performance claims, compare equivalent production builds and conditions.
- Run `npm run check` and `npm test` for changed code.
