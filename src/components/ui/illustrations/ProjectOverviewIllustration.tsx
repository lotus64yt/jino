import React from 'react';

interface Props {
  className?: string;
}

export default function ProjectOverviewIllustration({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bloc 1 */}
      <rect x="100" y="10" width="60" height="20" rx="3" fill="#2563EB" />
      {/* Bloc 2 */}
      <rect x="100" y="50" width="60" height="20" rx="3" fill="#06B6D4" />
      {/* Bloc 3 */}
      <rect x="100" y="90" width="60" height="20" rx="3" fill="#2563EB" />
      {/* Bloc 4 - à droite du bloc 2 */}
      <rect x="170" y="50" width="60" height="20" rx="3" fill="#F59E0B" />

      {/* Connexions */}
      <line x1="130" y1="30" x2="130" y2="50" stroke="#D1D5DB" strokeWidth="2" />
      <line x1="130" y1="70" x2="130" y2="90" stroke="#D1D5DB" strokeWidth="2" />
      <line x1="160" y1="60" x2="170" y2="60" stroke="#2563EB" strokeWidth="2" />
    </svg>
  );
}
