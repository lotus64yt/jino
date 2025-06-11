import React from 'react';

interface BlockConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // Optional callback to save/apply configuration
  blockName: string; // Changed from blockType to blockName for clarity
  children?: React.ReactNode; // Changed from configurationUI to children
  documentation?: string;
}

const BlockConfigurationModal: React.FC<BlockConfigurationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  blockName,
  children,
  documentation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"> 
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-config-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative bg-white p-6 rounded-lg shadow-xl max-w-lg w-full z-50 flex flex-col animate-fade-up"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 text-zinc-900 flex-shrink-0">
          <h2 id="block-config-title" className="text-xl font-semibold">Configuration: {blockName}</h2>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-zinc-700 text-2xl transition-colors"
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

        <div className="mt-6 flex justify-end space-x-3 flex-shrink-0"> {/* Footer */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-button-secondary-bg text-button-secondary-text rounded-md hover:bg-button-secondary-bg/80 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition transform hover:scale-105"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); }}
              className="px-4 py-2 bg-button-primary-bg text-button-primary-text rounded-md hover:bg-button-primary-bg/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition transform hover:scale-105"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockConfigurationModal;
