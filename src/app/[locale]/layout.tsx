import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SpicyFooter from "@/components/layout/SpicyFooter";
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
  title: "Spicy Community - Tournament Management",
  description: "Advanced tournament management system for the Spicy Community.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo_new.png",
  },
  other: {
    google: "notranslate",
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
    <html lang={locale} className="dark" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-[#ffaa00] selection:text-black`}>
        <NextIntlClientProvider messages={messages}>
          <UnoAlertProvider>
            <Navbar />
            <main className="pt-32 min-h-screen relative z-0">
              {children}
            </main>
            <SpicyFooter />
          </UnoAlertProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
