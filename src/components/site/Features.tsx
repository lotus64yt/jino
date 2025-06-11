import React from 'react';

const FeatureItem = ({ title, description, Icon }: { title: string; description: string; Icon: React.FC<{ className?: string }>; }) => (
  <div className="flex flex-col items-center text-center p-4 bg-card-bg rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105">
    <Icon className="h-10 w-10 text-primary mb-3" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

// Example SVG icons
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.4 16.6L4.8 12L9.4 7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.6 16.6L19.2 12L14.6 7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const BlocksIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" fill="currentColor" />
    <rect x="14" y="3" width="7" height="7" fill="currentColor" />
    <rect x="3" y="14" width="7" height="7" fill="currentColor" />
    <rect x="14" y="14" width="7" height="7" fill="currentColor" />
  </svg>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 6l-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Features() {
  return (
    <section className="py-20 px-4 bg-background text-foreground">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureItem
          title="Visual Programming"
          description="Build your logic with intuitive drag-and-drop blocks."
          Icon={BlocksIcon}
        />
        <FeatureItem
          title="Code Generation"
          description="Export clean Arduino code with one click."
          Icon={CodeIcon}
        />
        <FeatureItem
          title="Seamless Upload"
          description="Upload directly to your Arduino board right from the browser. (Feature in development)"
          Icon={UploadIcon}
        />
      </div>
    </section>
  );
}
