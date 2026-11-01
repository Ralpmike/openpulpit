import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Cache Components and partial prefetching stay off: OpenPulpit pages are
  // mostly per-request (live status, signed-in state) and run on Cloudflare
  // through OpenNext. Revisit once OpenNext documents support for them.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Gives `next dev` access to the Cloudflare bindings (local D1, R2) through getCloudflareContext().
initOpenNextCloudflareForDev();
