import React from 'react';

export interface Port {
  id: string;
  name?: string;
  dataType: string; // e.g., 'execution', 'number', 'string', 'boolean'
  kind: 'execution' | 'data'; // Added: Differentiates between execution and data flow
  flow: 'in' | 'out'; // Added: Specifies if the port is for input or output
  color?: string; // Optional: For custom port color
  providesData?: Port[]; // Added: For ports that also provide sub-data-ports (e.g., loop elements)
}

// Define a more specific type for the config prop
export interface BlockConfig {
  value?: string | number | boolean | string[]; // For constant blocks (assuming array elements are strings for now)
  name?: string; // For variable blocks
  pin?: number | string; // For LED, etc.
  delay?: number; // For Delay, etc.
  // Add other potential config properties here
}

export interface GenericBlockProps {
  blockId: string; // The original ID of the block type, e.g., "led_on"
  instanceId: string; // Unique instance ID for this block on the canvas
  name: string;
  config?: BlockConfig; // Added: To display configured values on the block
  executionIn?: Port;
  executionOut?: Port;
  executionOuts?: Port[]; // Added: Support for multiple execution outputs
  dataIns?: Port[];
  dataOuts?: Port[];
  onOpenConfiguration?: (instanceId: string, blockId: string) => void; // Callback to open configuration
  onPortClick?: (
    blockInstanceId: string,
    port: Port, // Pass the full port object
    portDomElement: HTMLDivElement // Pass the DOM element for position calculation
  ) => void;
}

// Helper function to get port-specific styles
const getPortShapeClasses = (dataType: string, customColor?: string): string => {
  if (customColor) { // If a custom color is provided, use it directly for background
    return `w-3.5 h-3.5 border-gray-500 rounded-full`; // Base shape, color will be applied via style
  }
  switch (dataType) {
    case 'number':
      return 'w-3.5 h-3.5 bg-sky-300 border-sky-500 rounded-sm'; // Square-ish for numbers
    case 'string':
      return 'w-4 h-3 bg-purple-300 border-purple-500 rounded-md'; // Wider, rounded for strings
    case 'boolean':
      return 'w-3.5 h-3.5 bg-yellow-300 border-yellow-500 transform rotate-45'; // Diamond for booleans (rotated square)
    case 'array': // Added style for array data type
      return 'w-4 h-4 bg-green-300 border-green-500 rounded-full flex items-center justify-center'; // Circle with inner dot (conceptual)
    case 'execution': // Should not be called for data ports, but as a fallback
      return 'w-4 h-4 bg-gray-300 border-gray-500 rounded-full';
    default:
      return 'w-3.5 h-3.5 bg-gray-300 border-gray-500 rounded-full'; // Default circle for unknown types
  }
};

const GenericBlock: React.FC<GenericBlockProps> = ({
  blockId,
  instanceId,
  name,
  config, // Added config prop
  executionIn,
  executionOut,
  executionOuts = [], // Default to empty array
  dataIns = [],
  dataOuts = [],
  onOpenConfiguration,
  onPortClick,
}) => {
  // Calculate vertical spacing for data ports
  const dataPortSpacing = 100 / (Math.max(dataIns.length, dataOuts.length, 1) + 1);

  const handleConfigButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent block dragging
    if (onOpenConfiguration) {
      onOpenConfiguration(instanceId, blockId);
    }
  };

  const handlePortDivClick = (
    e: React.MouseEvent<HTMLDivElement>,
    port: Port
  ) => {
    e.stopPropagation(); // Prevent block dragging or config modal opening
    if (onPortClick) {
      onPortClick(instanceId, port, e.currentTarget as HTMLDivElement);
    }
  };

  // Determine if the block is a "Valeur" (constant) block
  const isConstantBlock = name.startsWith('Valeur');
  
  let displayValue: string | null = null;
  if (config?.value !== undefined && config.value !== null) {
    if (Array.isArray(config.value)) {
      // Display array as [elem1, elem2, ...]
      // Truncate if too long, e.g., show first 2-3 elements and "..."
      const arr = config.value as string[]; // Cast based on BlockConfig
      if (arr.length > 3) {
        displayValue = `[${arr.slice(0, 2).join(', ')}, ..., ${arr[arr.length -1]}]`;
      } else {
        displayValue = `[${arr.join(', ')}]`;
      }
      if (displayValue === '[]') displayValue = '[Vide]'; // Explicitly show empty array
    } else {
      displayValue = String(config.value);
    }
  } else if (blockId.startsWith('variable_') && config?.name) {
    displayValue = config.name;
  }


  return (
    <div
      data-block-id={blockId}
      data-instance-id={instanceId}
      className="relative p-4 w-full h-full bg-white text-blue-700 border-2 border-blue-500 rounded-lg shadow-md hover:border-blue-700 transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-xl flex flex-col justify-center items-center select-none"
    >
      {/* Configuration Button (Top-Left) */}
      {onOpenConfiguration && (
        <button
          title="Configurer le bloc"
          onClick={handleConfigButtonClick}
          className="absolute top-1 left-1 w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center z-10 p-1"
        >
          {/* Simple gear icon (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 1.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.255c.007-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Block Name (ensure it doesn't overlap with the button) */}
      <div className="text-sm font-medium mt-2 mb-1 truncate px-2 text-center">{name}</div>

      {/* Display Configured Value for Constant Blocks or Variable Name */}
      {displayValue !== null && (
        <div 
          title={displayValue} // Show full value on hover if truncated
          className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-sm mb-1 truncate max-w-[calc(100%-1rem)]">
          {isConstantBlock && typeof config?.value === 'boolean' 
            ? (config.value ? 'Vrai' : 'Faux') 
            : displayValue}
        </div>
      )}

      {/* Execution Input Port (Top) */}
      {executionIn && (
        <div
          data-port-id={executionIn.id} // Added data-port-id
          key={"exIn" + executionIn.id}
          title={`Exec In: ${executionIn.name || executionIn.dataType} (${executionIn.kind})`}
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-500 rounded-full cursor-pointer hover:bg-gray-400`}
          style={{ backgroundColor: executionIn.color || '#D1D5DB' }} // Use custom color or default gray-300
          onClick={(e) => handlePortDivClick(e, executionIn)}
        />
      )}

      {/* Data Input Ports (Left) */}
      {dataIns.map((port, index) => (
        <div
          data-port-id={port.id} // Added data-port-id
          key={"dataIn"+ port.id + index.toString()}
          title={`Data In: ${port.name || port.dataType} (${port.dataType}, ${port.kind})`}
          className={`absolute left-0 -translate-x-1/2 border-2 cursor-pointer hover:opacity-80 ${getPortShapeClasses(port.dataType, port.color)}`}
          style={{ 
            top: `${(index + 1) * dataPortSpacing}%`, 
            transform: `translate(-50%, -50%)`,
            backgroundColor: port.color // Apply custom color if available
          }}
          onClick={(e) => handlePortDivClick(e, port)}
        >
          {port.dataType === 'array' && (
            <span className="block w-1.5 h-1.5 bg-green-700 rounded-full"></span> // Inner dot for array ports
          )}
        </div>
      ))}

      {/* Data Output Ports (Right) */}
      {dataOuts.map((port, index) => (
        <div
          data-port-id={port.id} // Added data-port-id
          key={"dataOut"+port.id+index.toString()}
          title={`Data Out: ${port.name || port.dataType} (${port.dataType}, ${port.kind})`}
          className={`absolute right-0 translate-x-1/2 border-2 cursor-pointer hover:opacity-80 ${getPortShapeClasses(port.dataType, port.color)}`}
          style={{ 
            top: `${(index + 1) * dataPortSpacing}%`, 
            transform: `translate(50%, -50%)`,
            backgroundColor: port.color // Apply custom color if available
          }}
          onClick={(e) => handlePortDivClick(e, port)}
        >
          {port.dataType === 'array' && (
            <span className="block w-1.5 h-1.5 bg-green-700 rounded-full"></span> // Inner dot for array ports
          )}
        </div>
      ))}

      {/* Execution Output Port (Bottom) - Now handles multiple execution outputs */}
      {executionOuts && executionOuts.map((port, index, arr) => ( // Changed to executionOuts (plural)
        <div
          data-port-id={port.id} // Added data-port-id
          key={"exOut"+port.id+index.toString()}
          title={`Exec Out: ${port.name || port.dataType} (${port.kind})`}
          className={`absolute bottom-0 border-2 border-gray-500 rounded-full cursor-pointer hover:bg-gray-400 w-4 h-4`}
          style={{
            left: `${(index + 1) * (100 / (arr.length + 1))}%`, // Distribute horizontally
            transform: 'translate(-50%, 50%)',
            backgroundColor: port.color || '#D1D5DB' // Use custom color or default gray-300
          }}
          onClick={(e) => handlePortDivClick(e, port)}
        />
      ))}
      {/* Fallback for single executionOut if executionOuts is not provided (for backward compatibility if needed) */}
      {!executionOuts && executionOut && (
         <div
           data-port-id={executionOut.id} // Added data-port-id
           key={executionOut.id}
           title={`Exec Out: ${executionOut.name || executionOut.dataType} (${executionOut.kind})`}
           className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 border-2 border-gray-500 rounded-full cursor-pointer hover:bg-gray-400`}
           style={{ backgroundColor: executionOut.color || '#D1D5DB' }} // Use custom color or default gray-300
           onClick={(e) => handlePortDivClick(e, executionOut)}
         />
      )}
    </div>
  );
};

export default GenericBlock;
