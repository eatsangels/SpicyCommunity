import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
import { UnoAlertProvider } from "@/components/ui/UnoAlertSystem";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://spicycommunity.com"),
  title: {
    default: "Spicy Community - Elite Tournament Platform",
    template: "%s | Spicy Community"
  },
  description: "Advanced tournament management platform for eSports and competitive gaming. Manage brackets, participants, and live scores with the Spicy Arena.",
  keywords: ["tournaments", "bracket manager", "esports", "gaming community", "live brackets", "tournament engine"],
  authors: [{ name: "Edward Trinidad" }],
  creator: "Spicy Community",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo_new.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://spicycommunity.com", // Adjust if domain is different
    siteName: "Spicy Community",
    title: "Spicy Community - Tournament Management",
    description: "The ultimate engine for competitive gaming tournaments.",
    images: [
      {
        url: "/logo_new.png",
        width: 1200,
        height: 630,
        alt: "Spicy Community Branding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spicy Community | eSports Arena",
    description: "Professional tournament brackets and live updates for the competitive community.",
    images: ["/logo_new.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    google: "notranslate",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'en';

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-[#ffaa00] selection:text-black`}>
        <NextIntlClientProvider messages={messages}>
          <UnoAlertProvider>
            <Navbar />
            <main className="min-h-screen relative z-0">
              {children}
            </main>
            <FooterWrapper />
          </UnoAlertProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
