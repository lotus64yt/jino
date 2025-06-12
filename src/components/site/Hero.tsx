"use client";
import Link from 'next/link';
import CodeBlocksIllustration from '@/components/ui/illustrations/CodeBlocksIllustration';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="text-center py-20 px-4 bg-background text-foreground">
      <div className="max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-5xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-lg mb-6">{t('hero.subtitle')}</p>
        <Link
          href="/build"
          className="px-6 py-3 bg-button-primary-bg text-button-primary-text rounded-md hover:bg-button-primary-bg/90 transition transform hover:scale-105"
        >
          {t('hero.getStarted')}
        </Link>
      </div>
      <div className="mt-12 animate-fade-up">
        <CodeBlocksIllustration className="mx-auto w-full max-w-lg" />
      </div>
    </section>
  );
}
