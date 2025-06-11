import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import Navbar from '@/components/site/Navbar';
import { BgBlueRing } from '@/components/ui/background/BlueRing';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jino Docs',
  description: 'Documentation for Jino visual programming components',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <BgBlueRing />
        <Navbar />
        <main className="pt-16 bg-background text-foreground min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
