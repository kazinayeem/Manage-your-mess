import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
    title: {
      default: "BornoMess Manager",
      template: "%s | BornoMess Manager",
    },
    description: "Smart mess & hostel management by BornoSoft — Bangladesh's trusted platform.",
    applicationName: "BornoMess Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BornoMess",
  },
  formatDetection: {
    telephone: false,
  },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    openGraph: {
      images: [{ url: "/cover.png", width: 1200, height: 630, alt: "BornoMess Manager" }],
    },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
