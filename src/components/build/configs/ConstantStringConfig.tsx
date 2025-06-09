import React, { useState, useEffect } from 'react';

export interface ConstantStringConfigData {
  value: string;
}

interface ConstantStringConfigProps {
  initialData?: ConstantStringConfigData;
  onSave: (data: ConstantStringConfigData) => void;
  instanceId: string;
}

const ConstantStringConfig: React.FC<ConstantStringConfigProps> = ({ initialData, onSave, instanceId }) => {
  const [value, setValue] = useState<string>(initialData?.value || '');

  useEffect(() => {
    setValue(initialData?.value || '');
  }, [initialData]);

  const handleSave = () => {
    onSave({ value });
  };

  return (
    <div className="p-2 text-zinc-900">
      <label htmlFor={`const-str-val-${instanceId}`} className="block text-sm font-medium mb-1">
        Texte:
      </label>
      <input
        type="text"
        id={`const-str-val-${instanceId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
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

export default ConstantStringConfig;
