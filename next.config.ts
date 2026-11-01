import type { NextConfig } from "next";

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
