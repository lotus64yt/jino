import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from '@/components/site/Navbar';
import { LanguageProvider } from '@/context/LanguageContext';
import { BgBlueRing } from "@/components/ui/background/BlueRing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jino - Visual Arduino Programming",
  description: "Build, connect and upload Arduino projects with a visual programming interface.",
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
          {/* Site Navbar */}
          <Navbar />
          {/* Main Content */}
          <main className="pt-16">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
