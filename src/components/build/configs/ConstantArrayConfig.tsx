'use client';

import React, { useState, useEffect } from 'react';

export interface ConstantArrayConfigData {
  value: (string | number | boolean)[];
}

interface ConstantArrayConfigProps {
  config: ConstantArrayConfigData;
  onConfigChange: (newConfig: ConstantArrayConfigData) => void;
  blockId: string;
}

const ConstantArrayConfig: React.FC<ConstantArrayConfigProps> = ({ config, onConfigChange, blockId }) => {
  const [items, setItems] = useState<(string | number | boolean)[]>(config.value || []);
  const [newItem, setNewItem] = useState<string>('');
  // For simplicity, we'll handle all items as strings initially for input purposes.
  // Type conversion can be handled during code generation or when the config is saved if needed.

  useEffect(() => {
    setItems(config.value || []);
  }, [config.value]);

  const handleAddItem = () => {
    if (newItem.trim() === '') return;
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onConfigChange({ value: updatedItems });
    setNewItem('');
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onConfigChange({ value: updatedItems });
  };

  const handleItemChange = (index: number, value: string) => {
    const updatedItems = items.map((item, i) => (i === index ? value : item));
    setItems(updatedItems);
    onConfigChange({ value: updatedItems });
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-md shadow-lg">
      <h4 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">
        Configuration: Tableau Constant
      </h4>
      
      <div className="mb-4">
        <label htmlFor={`${blockId}-new-item`} className="block text-sm font-medium text-gray-300 mb-1">
          Nouvel Élément:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id={`${blockId}-new-item`}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Entrez une valeur"
            className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          >
            Ajouter
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div>
          <h5 className="text-md font-medium mb-2 text-gray-400">Éléments du Tableau:</h5>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                <input
                  type="text"
                  value={String(item)} // Ensure value is string for input
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="block w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm text-xs"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic">Le tableau est vide. Ajoutez des éléments ci-dessus.</p>
      )}
    </div>
  );
};

export default ConstantArrayConfig;
