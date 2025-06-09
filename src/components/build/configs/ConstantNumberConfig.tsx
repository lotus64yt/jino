import React, { useState, useEffect } from 'react';

export interface ConstantNumberConfigData {
  value: number;
}

interface ConstantNumberConfigProps {
  initialData?: ConstantNumberConfigData;
  onSave: (data: ConstantNumberConfigData) => void;
  instanceId: string; // Not directly used in this simple config, but good practice to include
}

const ConstantNumberConfig: React.FC<ConstantNumberConfigProps> = ({ initialData, onSave, instanceId }) => {
  const [value, setValue] = useState<number>(initialData?.value || 0);

  useEffect(() => {
    // If you need to update internal state when initialData changes from outside
    setValue(initialData?.value || 0);
  }, [initialData]);

  const handleSave = () => {
    onSave({ value });
  };

  return (
    <div className="p-2 text-zinc-900">
      <label htmlFor={`const-num-val-${instanceId}`} className="block text-sm font-medium mb-1">
        Valeur Numérique:
      </label>
      <input
        type="number"
        id={`const-num-val-${instanceId}`}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
};

export default ConstantNumberConfig;
