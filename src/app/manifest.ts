import type { MetadataRoute } from "next";

/** Requirement 30: installable, app-like, before native apps exist. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenPulpit",
    short_name: "OpenPulpit",
    description: "Listen to preachers live and replay their sermons. Light on data, built for phones.",
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcfbf8",
    theme_color: "#24478f",
    lang: "en-NG",
    categories: ["lifestyle", "music", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Following", url: "/following", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Go live", url: "/go-live", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
