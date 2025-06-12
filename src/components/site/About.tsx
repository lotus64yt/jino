"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

import ProjectOverviewIllustration from '@/components/ui/illustrations/ProjectOverviewIllustration';
export default function About() {
  const { t } = useLanguage();
  return (
    <section className="py-20 px-4 bg-muted-bg text-foreground">
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center lg:items-start gap-8">
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-bold mb-4">{t('about.title')}</h2>
          <p className="text-lg text-gray-300 mb-4">
            {t('about.paragraph1')}
          </p>
          <p className="text-lg text-gray-300">
            {t('about.paragraph2')}
          </p>
        </div>
        <div className="lg:w-1/2">
        <ProjectOverviewIllustration
          className="w-full rounded-lg shadow-lg"
        />
        </div>
      </div>
    </section>
  );
}
