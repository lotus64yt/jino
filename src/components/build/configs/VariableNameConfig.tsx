'use client';

import React, { useState, useEffect } from 'react';

export interface VariableNameConfigData { // Exporting for use in DropZone
  name: string;
  isNew?: boolean; // True if this variable was newly created by this block instance
  dataType?: string; // Add dataType
  arrayElementType?: string; // Added to store the type of elements in an array e.g. 'Nombre', 'Texte'
}

interface VariableNameConfigProps {
  config: VariableNameConfigData;
  onConfigChange: (newConfig: VariableNameConfigData) => void;
  blockId: string;
  blockName: string; // e.g., "Définir Variable Nombre", "Lire Variable Texte"
  existingVariables?: VariableNameConfigData[]; // Changed from string[]
  isSetter: boolean; // True if the block is a "Définir Variable" type
}

const VariableNameConfig: React.FC<VariableNameConfigProps> = ({
  config,
  onConfigChange,
  blockId,
  blockName,
  existingVariables = [], // Changed from existingVariableNames
  isSetter,
}) => {
  const [currentVariableName, setCurrentVariableName] = useState<string>(config.name || '');
  const [currentVariableType, setCurrentVariableType] = useState<string | undefined>(config.dataType);
  const [newVariableNameDraft, setNewVariableNameDraft] = useState<string>('');
  const [newVariableTypeDraft, setNewVariableTypeDraft] = useState<string>('Nombre'); // Default type for new variable
  const [newArrayElementTypeDraft, setNewArrayElementTypeDraft] = useState<string>('Nombre'); // For array element type
  const [showCreateInput, setShowCreateInput] = useState<boolean>(false);

  /*const getVariableTypeFromBlockName = React.useCallback(() => {
    // This function is less relevant now with generic blocks, but can be a fallback
    // For variable_get, the type is determined by the selected variable or block's current config
    // For variable_set, the type is chosen during creation.
    if (config.dataType) return config.dataType; // Prefer dataType from config if available

    if (blockName.toLowerCase().includes('nombre')) return 'Nombre';
    if (blockName.toLowerCase().includes('texte')) return 'Texte';
    if (blockName.toLowerCase().includes('booléen')) return 'Booléen';
    if (blockName.toLowerCase().includes('tableau')) return 'Tableau';
    return ''; // Return empty or a sensible default if no type can be derived
  }, [blockName, config.dataType]);*/

  useEffect(() => {
    // Determine if a variable is actually selected and exists
    const selectedVar = config.name ? existingVariables.find(v => v.name === config.name) : undefined;

    if (selectedVar) {
      setCurrentVariableName(selectedVar.name);
      setCurrentVariableType(selectedVar.dataType);
      // Ensure config reflects the selected variable's type if it was different
      // This is important for variable_get blocks primarily
      if (config.dataType !== selectedVar.dataType || (selectedVar.dataType === 'Tableau' && config.arrayElementType !== selectedVar.arrayElementType)) {
        onConfigChange({ 
            ...config, 
            name: selectedVar.name, 
            dataType: selectedVar.dataType, 
            arrayElementType: selectedVar.arrayElementType 
        });
      }
    } else if (isSetter && config.isNew) {
      // For a new variable being defined by a setter, allow type selection
      // The type is part of the config already, so just ensure UI reflects it.
      setCurrentVariableName(config.name);
      setCurrentVariableType(config.dataType);
    } else if (!isSetter && !selectedVar && config.name) {
        // A variable is named in the config but doesn't exist (e.g. loaded project with missing var)
        // console.warn(`Variable "${config.name}" not found in existing variables.`);
        // Optionally clear it or mark as invalid
        // For now, keep it, DropZone might handle this visually
        setCurrentVariableName(config.name);
        setCurrentVariableType(config.dataType); // Keep its configured type
    }

    // If it's a setter and no variable is selected or being created, prompt to create/select
    if (isSetter && !config.name && existingVariables.length > 0) {
      setShowCreateInput(false); // Default to selection if variables exist
    } else if (isSetter && !config.name) {
      setShowCreateInput(true); // Default to creation if no variables exist
    }

  }, [config, existingVariables, isSetter, onConfigChange]);

  const handleSelectVariable = (selectedName: string) => {
    const selectedVar = existingVariables.find(v => v.name === selectedName);
    if (selectedVar) {
      setCurrentVariableName(selectedVar.name);
      setCurrentVariableType(selectedVar.dataType);
      onConfigChange({ 
        name: selectedVar.name, 
        dataType: selectedVar.dataType, 
        isNew: false, 
        arrayElementType: selectedVar.arrayElementType 
      });
      setShowCreateInput(false);
    }
  };

  const handleCreateVariable = () => {
    if (newVariableNameDraft.trim() === '') {
      alert('Le nom de la variable ne peut pas être vide.');
      return;
    }
    if (existingVariables.some(v => v.name === newVariableNameDraft.trim())) {
      alert('Une variable avec ce nom existe déjà.');
      return;
    }
    const newVarConfig: VariableNameConfigData = {
      name: newVariableNameDraft.trim(),
      dataType: newVariableTypeDraft,
      isNew: true,
      arrayElementType: newVariableTypeDraft === 'Tableau' ? newArrayElementTypeDraft : undefined,
    };
    onConfigChange(newVarConfig);
    setCurrentVariableName(newVarConfig.name);
    setCurrentVariableType(newVarConfig.dataType);
    setShowCreateInput(false);
    setNewVariableNameDraft(''); // Reset draft
  };

  const availableTypes = ['Nombre', 'Texte', 'Booléen', 'Tableau'];
  const arrayElementTypes = ['Nombre', 'Texte', 'Booléen']; // Cannot have array of arrays for now

  // Determine the value for the select input.
  /*const selectDefaultValue = showCreateInput ? '__CREATE_NEW__' : (existingVariables.find(v => v.name === currentVariableName) ? currentVariableName : '');
  
  const displayedTypeForInfo = showCreateInput 
    ? newVariableTypeDraft 
    : (isSetter 
        ? (currentVariableType || 'Non défini') 
        : (currentVariableType || 'Indéfini (sélectionnez une variable)'));

  // Filter existing variables for the dropdown based on the block type
  const filteredExistingVariables = isSetter 
    ? existingVariables // Show all for setters
    : existingVariables; // For getters, always show ALL variables. The block adapts its type upon selection.
*/
  return (
    <div className="p-2 space-y-3 bg-gray-700 rounded-md">
      <p className="text-sm font-medium text-gray-200">{blockName}</p>
      
      {isSetter ? (
        // UI for "Définir Variable" (Setter)
        <>
          {existingVariables.length > 0 && !showCreateInput && (
            <div className="space-y-1">
              <label htmlFor={`${blockId}-select`} className="block text-xs font-medium text-gray-300">Sélectionner variable existante:</label>
              <select
                id={`${blockId}-select`}
                value={currentVariableName || ''}
                onChange={(e) => handleSelectVariable(e.target.value)}
                className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>-- Choisir --</option>
                {existingVariables.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.dataType}{v.dataType === 'Tableau' ? `[${v.arrayElementType || 'any'}]` : ''})</option>
                ))}
              </select>
            </div>
          )}

          {(existingVariables.length === 0 || showCreateInput) && (
            <div className="space-y-2 p-2 border border-gray-600 rounded-md">
              <p className="text-xs text-gray-400">{existingVariables.length > 0 ? "Ou créer une nouvelle variable:" : "Créer une nouvelle variable:"}</p>
              <div>
                <label htmlFor={`${blockId}-new-name`} className="block text-xs font-medium text-gray-300">Nom de la nouvelle variable:</label>
                <input
                  type="text"
                  id={`${blockId}-new-name`}
                  value={newVariableNameDraft}
                  onChange={(e) => setNewVariableNameDraft(e.target.value)}
                  placeholder="maNouvelleVariable"
                  className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor={`${blockId}-new-type`} className="block text-xs font-medium text-gray-300">Type de la nouvelle variable:</label>
                <select
                  id={`${blockId}-new-type`}
                  value={newVariableTypeDraft}
                  onChange={(e) => setNewVariableTypeDraft(e.target.value)}
                  className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {newVariableTypeDraft === 'Tableau' && (
                <div>
                  <label htmlFor={`${blockId}-new-array-element-type`} className="block text-xs font-medium text-gray-300">Type des éléments du tableau:</label>
                  <select
                    id={`${blockId}-new-array-element-type`}
                    value={newArrayElementTypeDraft}
                    onChange={(e) => setNewArrayElementTypeDraft(e.target.value)}
                    className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    {arrayElementTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              <button 
                onClick={handleCreateVariable}
                className="w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
              >
                Créer et Utiliser
              </button>
            </div>
          )}

          {existingVariables.length > 0 && (
            <button 
              onClick={() => setShowCreateInput(!showCreateInput)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              {showCreateInput ? "Sélectionner une variable existante" : "Créer une nouvelle variable"}
            </button>
          )}
        </>
      ) : (
        // UI for "Lire Variable" (Getter)
        <div className="space-y-1">
          <label htmlFor={`${blockId}-select-getter`} className="block text-xs font-medium text-gray-300">Nom de la variable:</label>
          {existingVariables.length > 0 ? (
            <select
              id={`${blockId}-select-getter`}
              value={currentVariableName || ''}
              onChange={(e) => handleSelectVariable(e.target.value)}
              className="w-full p-1.5 bg-gray-800 border border-gray-600 rounded-md text-xs text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>-- Choisir une variable --</option>
              {existingVariables.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.dataType}{v.dataType === 'Tableau' ? `[${v.arrayElementType || 'any'}]` : ''})</option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-yellow-400">Aucune variable définie. Créez-en une avec un bloc &quot;Définir Variable&quot;.</p>
          )}
        </div>
      )}

      {currentVariableName && (
        <div className="mt-2 text-xs text-gray-400">
          <p>Variable sélectionnée: <span className="font-semibold text-gray-200">{currentVariableName}</span></p>
          <p>Type: <span className="font-semibold text-gray-200">{currentVariableType}{currentVariableType === 'Tableau' && config.arrayElementType ? ` [${config.arrayElementType}]` : ''}</span></p>
        </div>
      )}
    </div>
  );
};

export default VariableNameConfig;
