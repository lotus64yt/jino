"use client";

import React from 'react';

interface DropZoneControlButtonsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoFitView: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

const DropZoneControlButtons: React.FC<DropZoneControlButtonsProps> = ({
  onZoomIn,
  onZoomOut,
  onAutoFitView,
  canZoomIn,
  canZoomOut,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded shadow text-xs"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded shadow text-xs"
        title="Zoom Out"
      >
        -
      </button>
      <button
        onClick={onAutoFitView}
        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-3 rounded shadow text-xs"
        title="Fit View"
      >
        Fit
      </button>
    </div>
  );
};

export default DropZoneControlButtons;
