import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#D5C19E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "iRopit — Sync Your Devices Seamlessly",
    template: "%s | iRopit",
  },
  description:
    "Sync SMS, calls, notifications, and chat between your phone and computer seamlessly with end-to-end encryption. Available on Android and Chrome.",
  keywords: [
    "iRopit",
    "sync devices",
    "SMS sync",
    "call history sync",
    "phone to PC",
    "Chrome extension",
    "Android app",
    "device sync",
    "cross-platform messaging",
  ],
  authors: [{ name: "iRopit" }],
  creator: "iRopit",
  publisher: "iRopit",
  metadataBase: new URL("https://www.iropit.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.iropit.com",
    siteName: "iRopit",
    title: "iRopit — Sync Your Devices Seamlessly",
    description:
      "Sync SMS, calls, notifications, and chat between your phone and computer with end-to-end encryption.",
    images: [
      {
        url: "/images/logo-full.png",
        width: 1200,
        height: 630,
        alt: "iRopit - Device Sync Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iRopit — Sync Your Devices Seamlessly",
    description:
      "Sync SMS, calls, notifications, and chat between your phone and computer with end-to-end encryption.",
    images: ["/images/logo-full.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "iRopit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-32.png" type="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <ServiceWorkerRegister />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
