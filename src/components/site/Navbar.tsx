"use client";
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  return (
    <header className="bg-background text-foreground py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">Jino</h1>
        <nav className="space-x-4">
          <Link href="/site" className="hover:text-primary transition">
            {t('nav.home')}
          </Link>
          <Link href="/docs" className="hover:text-primary transition">
            {t('nav.docs')}
          </Link>
          <Link href="/build" className="hover:text-primary transition">
            {t('nav.builder')}
          </Link>
          <a href="https://github.com/your-repo/jino" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
            {t('nav.github')}
          </a>
        </nav>
        {/* Language Switcher */}
        <div className="ml-4">
          <button onClick={() => setLang('en')} className={`px-2 ${lang === 'en' ? 'font-bold' : ''}`}>EN</button>
          <button onClick={() => setLang('fr')} className={`px-2 ${lang === 'fr' ? 'font-bold' : ''}`}>FR</button>
        </div>
      </div>
    </header>
  );
}
