"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

type Lang = 'en' | 'fr';

const translations: Record<Lang, Record<string, unknown>> = { en, fr };

interface LanguageContextProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: unknown = translations[lang];
    for (const k of keys) {
      if (typeof result === 'object' && result !== null && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
      if (result === undefined) return key;
    }
    return result as string;
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
