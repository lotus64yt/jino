"use client";

import React, { useState, useEffect } from 'react';

export interface DelayConfigData {
  duration: number;
}

interface DelayConfigProps {
  initialData?: DelayConfigData;
  onSave: (data: DelayConfigData) => void;
  instanceId: string;
}

const DelayConfig: React.FC<DelayConfigProps> = ({ initialData, onSave, instanceId }) => {
  const [duration, setDuration] = useState<number>(initialData?.duration || 1000);

  useEffect(() => {
    if (initialData) {
      setDuration(initialData.duration);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({ duration });
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Configuration du Délai (Instance: {instanceId})</h3>
      <div className="mb-4">
        <label htmlFor={`delay-duration-${instanceId}`} className="block text-sm font-medium text-gray-700 mb-1">
          Durée (ms)
        </label>
        <input
          type="number"
          id={`delay-duration-${instanceId}`}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Entrez la durée en millisecondes"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
      >
        Sauvegarder
      </button>
    </div>
  );
};

export default DelayConfig;
