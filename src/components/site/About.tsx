import React from 'react';

import ProjectOverviewIllustration from '@/components/ui/illustrations/ProjectOverviewIllustration';
export default function About() {
  return (
    <section className="py-20 px-4 bg-muted-bg text-foreground">
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center lg:items-start gap-8">
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-bold mb-4">About Jino</h2>
          <p className="text-lg text-gray-300 mb-4">
            Jino is a visual programming environment tailored for Arduino boards.
            Use drag-and-drop blocks to assemble logic, configure components with ease,
            and deploy your sketch with a single click.
          </p>
          <p className="text-lg text-gray-300">
            Designed for both beginners and experienced developers,
            Jino streamlines your workflow, letting you focus on creativity
            instead of boilerplate code.
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
