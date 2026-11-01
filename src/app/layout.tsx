import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// One self-hosted family, Latin only: every font byte costs listeners data.
const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OpenPulpit",
    template: "%s · OpenPulpit",
  },
  description:
    "Listen to preachers live and replay their sermons. Light on data, built for phones.",
  applicationName: "OpenPulpit",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontSans.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
