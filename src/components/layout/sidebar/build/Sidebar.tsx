import React, { useState } from 'react';
// Ensure your tsconfig.json has "resolveJsonModule": true and "esModuleInterop": true in compilerOptions
import componentsData from './components.json';
import { DefinedFunction } from '@/components/build/DropZone'; // Import DefinedFunction
import { ComponentProps as GlobalComponentProps } from '@/components/build/DropZone'; // To avoid name clash

// Define the structure for a single port
export interface PortDefinition {
  portId: string;
  name: string;
  dataType: string;
  kind: 'execution' | 'data';
  flow: 'in' | 'out';
  color?: string; // Added optional color
}

// Define the structure for default ports of a component
export interface DefaultPorts {
  executionIn?: PortDefinition;
  executionOuts?: PortDefinition[]; // Changed from executionOut
  dataIns?: PortDefinition[];
  dataOuts?: PortDefinition[];
}

export interface ComponentItem {
  id: string;
  name: string;
  defaultPorts: DefaultPorts; // Use the detailed DefaultPorts structure
  documentation?: string; // Added optional documentation
  // Removed type, as it's implicit or can be derived from defaultPorts if needed
}

interface CategoryGroup {
  category: string;
  items: ComponentItem[];
}

// Props for the Sidebar component
interface SidebarProps {
  components: GlobalComponentProps[]; // These are the base components from JSON, processed
  definedFunctions: DefinedFunction[];
}

// Combined type for items that can be dragged from the sidebar
// This includes original components and dynamically generated function call blocks
type DraggableSidebarItem = ComponentItem | {
  id: string;
  name: string;
  defaultPorts: DefaultPorts;
  category: string;
  // Potentially add a flag to distinguish function calls if needed for onDrop logic
  isFunctionCall?: boolean; 
  functionId?: string; // ID of the function being called
};

const Sidebar: React.FC<SidebarProps> = ({ /*components: baseComponents,*/ definedFunctions }) => {
  // Initialize state directly with the imported JSON data.
  // TypeScript should infer the type correctly if tsconfig is set up for JSON imports.
  const [categorizedComponents] = useState<CategoryGroup[]>(componentsData as CategoryGroup[]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, component: DraggableSidebarItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
  };

  // Prepare function call blocks from definedFunctions
  const functionCallBlocks: DraggableSidebarItem[] = definedFunctions.map(func => ({
    id: `call_func_${func.id}`,
    name: `Appeler ${func.name}`,
    defaultPorts: {
      executionIn: { portId: 'execIn', name: 'Exécution Entrée', dataType: 'execution', kind: 'execution', flow: 'in' },
      executionOuts: [{ portId: 'execOut', name: 'Exécution Sortie', dataType: 'execution', kind: 'execution', flow: 'out' }],
      dataIns: func.parameters.map(param => ({
        portId: `param_in_${param.id}`,
        name: param.name,
        dataType: param.dataType,
        kind: 'data',
        flow: 'in',
      })),
      // dataOuts: [] // Add if/when functions have return values
    },
    category: 'Fonctions Utilisateur', // Custom category for these blocks
    isFunctionCall: true, // Mark as a function call block
    functionId: func.id // Store the original function ID
    // documentation: `Appelle la fonction personnalisée ${func.name}.`
  }));

  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Composants</h2>
      <div>
        {categorizedComponents.map((categoryGroup) => (
          <div key={categoryGroup.category} className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-400">{categoryGroup.category}</h3>
            {categoryGroup.items.map((component) => (
              <div
                key={component.id}
                draggable
                onDragStart={(e) => handleDragStart(e, component)}
                className="p-2 mb-2 bg-gray-700 rounded cursor-grab hover:bg-gray-600 transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
              >
                {component.name}
              </div>
            ))}
          </div>
        ))}
        {/* Display User Defined Functions */}
        {functionCallBlocks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-400">Fonctions Utilisateur</h3>
            {functionCallBlocks.map((funcBlock) => (
              <div
                key={funcBlock.id}
                draggable
                onDragStart={(e) => handleDragStart(e, funcBlock)}
                className="p-2 mb-2 bg-gray-700 rounded cursor-grab hover:bg-gray-600 transition-colors"
              >
                {funcBlock.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
