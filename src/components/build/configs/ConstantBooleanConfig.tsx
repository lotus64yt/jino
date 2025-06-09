import React, { useState, useEffect } from 'react';

export interface ConstantBooleanConfigData {
  value: boolean;
}

interface ConstantBooleanConfigProps {
  initialData?: ConstantBooleanConfigData;
  onSave: (data: ConstantBooleanConfigData) => void;
  instanceId: string;
}

const ConstantBooleanConfig: React.FC<ConstantBooleanConfigProps> = ({ initialData, onSave, instanceId }) => {
  const [value, setValue] = useState<boolean>(initialData?.value || false);

  useEffect(() => {
    setValue(initialData?.value || false);
  }, [initialData]);

  const handleSave = () => {
    onSave({ value });
  };

  return (
    <div className="p-2 text-zinc-900">
      <label htmlFor={`const-bool-val-${instanceId}`} className="block text-sm font-medium mb-2">
        État (Booléen):
      </label>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`const-bool-val-${instanceId}`}
          checked={value}
          onChange={(e) => setValue(e.target.checked)}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={`const-bool-val-${instanceId}`} className="ml-2 text-sm">
          {value ? 'Vrai' : 'Faux'}
        </label>
      </div>
      <div className="mt-6 flex justify-end">
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

export default ConstantBooleanConfig;
