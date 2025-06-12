import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { BgBlueRing } from "@/components/ui/background/BlueRing";
import { LanguageProvider } from '@/context/LanguageContext';
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Build Jino",
  description: "Build your Arduino projects with Jino",
  keywords: ["Arduino", "Jino", "Build", "Projects"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <BgBlueRing />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
