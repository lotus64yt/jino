import React from 'react';

interface Props {
  className?: string;
}

export default function CodeBlocksIllustration({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bloc A - haut gauche */}
      <rect x="20" y="20" width="60" height="20" rx="4" fill="#3B82F6" />
      {/* Bloc B - milieu gauche */}
      <rect x="20" y="60" width="60" height="20" rx="4" fill="#0EA5E9" />
      {/* Bloc C - à droite de B */}
      <rect x="100" y="60" width="80" height="20" rx="4" fill="#6366F1" />
      {/* Bloc D - dessous C */}
      <rect x="100" y="100" width="80" height="20" rx="4" fill="#10B981" />

      {/* Connexions */}
      <line x1="50" y1="40" x2="50" y2="60" stroke="#111827" strokeWidth="2" />
      <line x1="80" y1="70" x2="100" y2="70" stroke="#111827" strokeWidth="2" />
      <line x1="140" y1="80" x2="140" y2="100" stroke="#111827" strokeWidth="2" />
    </svg>
  );
}
