import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { UnoAlertProvider } from "@/components/ui/UnoAlertSystem";
import PWAInstall from "@/components/pwa/PWAInstall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffaa00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Spicy Community - Tournament Management",
  description: "Advanced tournament management system for the Spicy Community.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Spicy",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-[#ffaa00] selection:text-black`}>
        <NextIntlClientProvider messages={messages}>
          <UnoAlertProvider>
            <PWAInstall />
            <Navbar />
            <main className="pt-24 min-h-screen">
              {children}
            </main>
          </UnoAlertProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
