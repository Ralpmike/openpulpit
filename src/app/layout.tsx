import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { getEnvAsync } from "@/lib/cloudflare";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";

import "./globals.css";
import { Providers } from "./providers";

// One self-hosted family, Latin only: every font byte costs listeners data.
const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const env = await getEnvAsync().catch(() => null);
  return {
    // Absolute links in preview cards (WhatsApp needs full URLs).
    metadataBase: new URL(env?.APP_URL || "http://localhost:3000"),
    title: { default: "OpenPulpit", template: "%s · OpenPulpit" },
    description: "Listen to preachers live and replay their sermons. Light on data, built for phones.",
    applicationName: "OpenPulpit",
    openGraph: { siteName: "OpenPulpit", images: [DEFAULT_OG_IMAGE], locale: "en_NG", type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#14161d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
