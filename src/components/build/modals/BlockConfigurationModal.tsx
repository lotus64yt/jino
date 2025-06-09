import React from 'react';

interface BlockConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockName: string; // Changed from blockType to blockName for clarity
  // instanceId: string; // instanceId can be part of blockName or not needed for display
  children?: React.ReactNode; // Changed from configurationUI to children
  documentation?: string;
}

const BlockConfigurationModal: React.FC<BlockConfigurationModalProps> = ({
  isOpen,
  onClose,
  blockName, // Changed from blockType
  // instanceId, // Removed as it might be redundant if included in blockName or not displayed
  children, // Changed from configurationUI
  documentation,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-4" // Added background opacity for better focus
      onClick={onClose} // Close on overlay click
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full z-50 flex flex-col" // Added flex flex-col
        style={{ maxHeight: '90vh' }} // Set a max height for the entire modal
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4 text-zinc-900 flex-shrink-0"> {/* flex-shrink-0 for header */}
          <h2 className="text-xl font-semibold">Configuration: {blockName}</h2>
          <button 
            onClick={onClose}
            className="text-zinc-900 hover:text-zinc-700 text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        <div className="modal-content-area overflow-y-auto flex-grow min-h-[100px] text-zinc-900"> {/* Added overflow-y-auto and flex-grow, adjusted min-h */}
          {children ? (
            children // Use children here
          ) : (
            <p>No specific configuration UI for this block type.</p>
          )}
        </div>

        {/* Documentation Section */}
        {documentation && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-zinc-900 flex-shrink-0"> {/* flex-shrink-0 for documentation */}
            <h3 className="text-md font-semibold mb-2">Documentation:</h3>
            <p className="text-sm text-gray-600">{documentation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3 flex-shrink-0"> {/* flex-shrink-0 for footer */}
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          {/* <button 
            // onClick={handleSave} // Implement save logic
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default BlockConfigurationModal;
