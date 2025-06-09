import React, { useState, useEffect } from 'react';

export interface LedConfigData {
  pin: number;
  state?: 'HIGH' | 'LOW'; // Added optional state, as DropZone logic implies it for some blocks
}

interface LedConfigProps {
  initialData?: LedConfigData; // Changed from currentConfig
  onSave: (newConfig: LedConfigData) => void;
  instanceId: string; // Added instanceId
}

const LedConfig: React.FC<LedConfigProps> = ({ initialData, onSave, instanceId }) => {
  const [pin, setPin] = useState<number>(initialData?.pin || 13); // Default to pin 13

  useEffect(() => {
    setPin(initialData?.pin || 13);
  }, [initialData]);

  const handleSave = () => {
    onSave({ pin: Number(pin) });
  };

  return (
    <div className="p-4"> {/* Added padding similar to DelayConfig */}
      <h3 className="text-lg font-semibold mb-3">Configuration LED (Instance: {instanceId})</h3> {/* Added title */}
      <div className="mb-4"> {/* Consistent spacing */}
        <label htmlFor={`led-pin-${instanceId}`} className="block text-sm font-medium text-gray-700 mb-1"> {/* Unique ID and margin */}
          Numéro de la broche (Pin) :
        </label>
        <input
          type="number"
          id={`led-pin-${instanceId}`} // Unique ID
          value={pin}
          onChange={(e) => setPin(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Consistent styling
          min="0"
        />
        <p className="mt-1 text-xs text-gray-500">
          Choisissez la broche numérique à laquelle la LED est connectée.
        </p>
      </div>
      <button // Added save button similar to DelayConfig
        onClick={handleSave}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
      >
        Sauvegarder
      </button>
    </div>
  );
};

export default LedConfig;
