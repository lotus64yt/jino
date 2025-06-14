import Hero from '@/components/site/Hero';
import About from '@/components/site/About';
import Features from '@/components/site/Features';

export default function SitePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex flex-col">
        <Hero />
        <About />
        <Features />
        {/* You can add more sections here (e.g., testimonials, footer) */}
      </main>
      <footer className="bg-muted-bg text-gray-400 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Jino. All rights reserved.</p>
          <p>
            Visit our <a href="https://github.com/lotus64yt/jino" className="text-primary hover:underline">GitHub</a> to contribute.
          </p>
        </div>
      </footer>
    </div>
  );
}
