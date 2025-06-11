import Link from 'next/link';
import CodeBlocksIllustration from '@/components/ui/illustrations/CodeBlocksIllustration';

export default function Hero() {
  return (
    <section className="text-center py-20 px-4 bg-background text-foreground">
      <div className="max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-5xl font-bold mb-4">Jino</h1>
        <p className="text-lg mb-6">Visual programming tool for Arduino. Build, connect, and upload your code effortlessly.</p>
        <Link
          href="/build"
          className="px-6 py-3 bg-button-primary-bg text-button-primary-text rounded-md hover:bg-button-primary-bg/90 transition transform hover:scale-105"
        >
          Get Started
        </Link>
      </div>
      <div className="mt-12 animate-fade-up">
        <CodeBlocksIllustration className="mx-auto w-full max-w-lg" />
      </div>
    </section>
  );
}
