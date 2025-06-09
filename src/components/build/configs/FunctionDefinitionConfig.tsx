// src/components/build/configs/FunctionDefinitionConfig.tsx

import React, { useState, useEffect } from 'react';

// Parameter structure within the config
export interface FunctionParameter {
  id: string; // Unique ID for the parameter, e.g., param_1678886400000_0
  name: string;
  dataType: string; // 'number', 'string', 'boolean', 'array', 'any'
}

export interface FunctionDefinitionConfigData {
  name?: string;
  params?: FunctionParameter[];
}

interface FunctionDefinitionConfigProps {
  initialData: FunctionDefinitionConfigData;
  onConfigChange: (config: FunctionDefinitionConfigData) => void;
  blockId: string; // instanceId of the block being configured
}

const availableDataTypes = ['number', 'string', 'boolean', 'array', 'any'];

const FunctionDefinitionConfig: React.FC<FunctionDefinitionConfigProps> = ({
  initialData,
  onConfigChange,
  blockId,
}) => {
  const [functionName, setFunctionName] = useState(initialData.name || 'maFonction');
  const [parameters, setParameters] = useState<FunctionParameter[]>(initialData.params || []);

  useEffect(() => {
    setFunctionName(initialData.name || 'maFonction');
    setParameters(initialData.params || []);
  }, [initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFunctionName(e.target.value);
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { id: `param_${Date.now()}_${parameters.length}`, name: `param${parameters.length + 1}`, dataType: 'number' },
    ]);
  };

  const handleParameterChange = (index: number, field: keyof FunctionParameter, value: string) => {
    const newParameters = [...parameters];
    newParameters[index] = {
      ...newParameters[index],
      [field]: value,
    };
    setParameters(newParameters);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onConfigChange({ name: functionName, params: parameters });
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor={`func-name-${blockId}`} className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la fonction:
        </label>
        <input
          type="text"
          id={`func-name-${blockId}`}
          value={functionName}
          onChange={handleNameChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-1 mb-2">Paramètres</legend>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {parameters.map((param, index) => (
            <div key={param.id} className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
              <input
                type="text"
                placeholder="Nom"
                value={param.name}
                onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                className="flex-grow px-2 py-1 border border-gray-300 rounded-md sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                value={param.dataType}
                onChange={(e) => handleParameterChange(index, 'dataType', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {availableDataTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
              <button
                onClick={() => handleRemoveParameter(index)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddParameter}
          className="mt-3 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
        >
          + Ajouter Paramètre
        </button>
      </fieldset>
      
      <button
        onClick={handleSave}
        className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold"
      >
        Sauvegarder
      </button>
    </div>
  );
};

export default FunctionDefinitionConfig;
