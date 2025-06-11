"use client";

import React from 'react';

export interface UploadStep {
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  details?: string; // Optional details for errors or specific info
}

interface ArduinoBoard {
  value: string;
  label: string;
}

interface UploadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: UploadStep[];
  currentStepIndex: number;
  uploadProgress: number; // Percentage 0-100, for the actual hex upload part
  overallError?: string | null; // For a general error message not tied to a specific step
  
  // New props for board and port selection
  availableBoards: ArduinoBoard[];
  selectedBoard: string | null;
  onBoardChange: (boardValue: string) => void;
  onSelectPort: () => Promise<void>;
  onInitiateUpload: () => void;
  isPortSelected: boolean;
  isConnectingPort: boolean; // To show loading state on port selection button
  currentPhase: 'initial_config' | 'uploading' | 'finished'; // To control UI
}

const UploadStatusModal: React.FC<UploadStatusModalProps> = ({
  isOpen,
  onClose,
  steps,
  currentStepIndex,
  uploadProgress,
  overallError,
  availableBoards,
  selectedBoard,
  onBoardChange,
  onSelectPort,
  onInitiateUpload,
  isPortSelected,
  isConnectingPort,
  currentPhase,
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: UploadStep['status'], isCurrent: boolean) => {
    if (status === 'error') return 'text-red-400';
    if (status === 'completed') return 'text-green-400';
    if (isCurrent || status === 'in-progress') return 'text-cyan-400';
    return 'text-gray-500'; // pending
  };

  const getStatusIcon = (status: UploadStep['status'], isCurrent: boolean) => {
    if (status === 'error') return '❌';
    if (status === 'completed') return '✅';
    if (isCurrent || status === 'in-progress') return '⏳';
    return '⚪'; // pending
  };

  const isUploadProcessStarted = steps.some(step => step.status !== 'pending');
  const showCloseButton = currentPhase === 'finished' || overallError || (currentPhase === 'uploading' && steps.every(step => step.status === 'completed' || step.status === 'error'));


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Téléversement Arduino</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>

        {currentPhase === 'initial_config' && (
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="board-select" className="block text-sm font-medium text-gray-300 mb-1">
                Modèle de carte Arduino :
              </label>
              <select
                id="board-select"
                value={selectedBoard || ''}
                onChange={(e) => onBoardChange(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500"
                disabled={isUploadProcessStarted}
              >
                <option value="" disabled>Sélectionner un modèle</option>
                {availableBoards.map(board => (
                  <option key={board.value} value={board.value}>{board.label}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={onSelectPort}
                disabled={!selectedBoard || isConnectingPort || isUploadProcessStarted}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnectingPort ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion au port...
                  </>
                ) : isPortSelected ? 'Port Sélectionné ✅' : 'Sélectionner le Port Série'}
              </button>
            </div>
            <div>
              <button
                onClick={onInitiateUpload}
                disabled={!selectedBoard || !isPortSelected || isUploadProcessStarted}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Téléverser
              </button>
            </div>
          </div>
        )}

        {(currentPhase === 'uploading' || currentPhase === 'finished') && (
          <>
            {overallError && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-300 rounded-md">
                <p className="font-semibold">Erreur :</p>
                <p>{overallError}</p>
              </div>
            )}

            <div className="overflow-y-auto flex-grow pr-2">
              <ul className="space-y-3 mb-4">
                {steps.map((step, index) => (
                  <li key={index} className={`flex items-start text-sm ${getStatusColor(step.status, index === currentStepIndex)}`}>
                    <span className="mr-3 w-5 text-center pt-0.5">{getStatusIcon(step.status, index === currentStepIndex)}</span>
                    <div className="flex-1">
                      <span className={index === currentStepIndex && step.status !== 'completed' && step.status !== 'error' ? 'font-bold animate-pulse' : (index === currentStepIndex ? 'font-bold' : '')}>{step.label}</span>
                      {step.status === 'error' && step.details && (
                        <p className="text-xs text-red-400 opacity-80 mt-1">{step.details}</p>
                      )}
                      {step.label.toLowerCase().includes('téléversement des pages') && index === currentStepIndex && step.status === 'in-progress' && (
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-cyan-500 h-2.5 rounded-full transition-all duration-150 ease-linear"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {currentPhase === 'finished' && steps.every(step => step.status === 'completed') && !overallError && (
              <p className="text-center text-green-400 font-semibold mt-4 pt-4 border-t border-gray-700">Téléversement terminé avec succès !</p>
            )}
             {currentPhase === 'finished' && (steps.some(step => step.status === 'error') || overallError) && (
                <button
                    onClick={onClose}
                    className="mt-4 w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                    Fermer
                </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadStatusModal;
