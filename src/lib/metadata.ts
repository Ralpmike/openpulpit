import type { Metadata } from "next";

export const DEFAULT_OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: "OpenPulpit" };

/**
 * Open Graph + Twitter tags for a shareable page, so WhatsApp, Facebook and X
 * show a preview card. `image` is the preacher's photo when they have one.
 */
export function shareMetadata(input: { title: string; description: string; path: string; image?: string | null; type?: "website" | "profile" | "music.song" }): Metadata {
  const images = input.image ? [{ url: input.image, width: 512, height: 512, alt: input.title }] : [DEFAULT_OG_IMAGE];
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: "OpenPulpit",
      type: input.type === "music.song" ? "website" : (input.type ?? "website"),
      images,
      locale: "en_NG",
    },
    twitter: { card: input.image ? "summary" : "summary_large_image", title: input.title, description: input.description, images: images.map((i) => i.url) },
  };
}
