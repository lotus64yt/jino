"use client";
import React, { useState, useEffect } from 'react';

export type LogicalOperator = 'AND' | 'OR' | 'NOT' | 'XOR';

export interface LogicOperationConfigData {
  operator: LogicalOperator;
  numInputs: number;
}

interface LogicOperationConfigProps {
  initialData: LogicOperationConfigData;
  onConfigChange: (config: LogicOperationConfigData) => void;
  // blockId: string; // instanceId - might not be needed directly by this component if onConfigChange handles it
}

const LogicOperationConfig: React.FC<LogicOperationConfigProps> = ({ initialData, onConfigChange }) => {
  const [operator, setOperator] = useState<LogicalOperator>(initialData.operator || 'AND');
  const [numInputs, setNumInputs] = useState<number>(initialData.numInputs || 2);

  useEffect(() => {
    // Ensure numInputs is valid for the selected operator
    let currentNumInputs = numInputs;
    if (operator === 'NOT') {
      if (currentNumInputs !== 1) {
        currentNumInputs = 1;
        setNumInputs(1);
      }
    } else {
      if (currentNumInputs < 2) {
        currentNumInputs = 2;
        setNumInputs(2);
      }
    }
    onConfigChange({ operator, numInputs: currentNumInputs });
  }, [operator, numInputs, onConfigChange]);

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as LogicalOperator;
    setOperator(newOperator);
    if (newOperator === 'NOT') {
      setNumInputs(1); // Automatically set numInputs to 1 for NOT
    } else if (numInputs < 2) {
      setNumInputs(2); // Ensure at least 2 inputs for other operators if current is less
    }
  };

  const handleNumInputsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 2; // Default to 2 if input is invalid

    if (operator === 'NOT') {
      val = 1;
    } else {
      if (val < 2) val = 2;
    }
    if (val > 10) val = 10; // Max 10 inputs for performance/UI reasons
    setNumInputs(val);
  };

  return (
    <div className="p-4 space-y-4 bg-gray-700 rounded-md">
      <div>
        <label htmlFor="logic-operator" className="block text-sm font-medium text-gray-300 mb-1">
          Opérateur Logique
        </label>
        <select
          id="logic-operator"
          value={operator}
          onChange={handleOperatorChange}
          className="block w-full p-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white sm:text-sm"
        >
          <option value="AND">ET (AND)</option>
          <option value="OR">OU (OR)</option>
          <option value="NOT">NON (NOT)</option>
          <option value="XOR">OU Exclusif (XOR)</option>
        </select>
      </div>

      {operator !== 'NOT' && (
        <div>
          <label htmlFor="num-inputs" className="block text-sm font-medium text-gray-300 mb-1">
            Nombre d&pos;entrées
          </label>
          <input
            type="number"
            id="num-inputs"
            value={numInputs}
            onChange={handleNumInputsChange}
            min="2"
            max="10" // Arbitrary max, can be adjusted
            className="block w-full p-2 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white sm:text-sm"
          />
        </div>
      )}
      {operator === 'NOT' && (
         <div>
          <p className="text-sm text-gray-400">L&apos;opérateur NON a toujours 1 entrée.</p>
        </div>
      )}
    </div>
  );
};

export default LogicOperationConfig;