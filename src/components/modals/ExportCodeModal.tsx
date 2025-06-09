'use client';

import React, { useState, useEffect } from 'react';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onExport now returns a Promise<string | null> (download URL or null on error)
  onExport: (options: { language: string; style: 'natural' | 'compressed' }) => Promise<string | null>;
}


const ExportCodeModal: React.FC<ExportCodeModalProps> = ({ isOpen, onClose, onExport }) => {
  const [language, setLanguage] = useState<string>('.ino'); // Default and only option for now
  const [style, setStyle] = useState<'natural' | 'compressed'>('natural');
  const [isLoading, setIsLoading] = useState(false);
  const [exportCompleted, setExportCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setExportCompleted(false);
      setDownloadUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleExportClick = async () => {
    setIsLoading(true);
    setExportCompleted(false);
    setDownloadUrl(null);
    try {
      const url = await onExport({ language, style });
      setDownloadUrl(url || null);
      setExportCompleted(true);
    } catch /*(e)*/ {
      setDownloadUrl(null);
      setExportCompleted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // For blob URLs or direct links
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'export.ino';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Options d&apos;Exportation du Code</h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-gray-300">Exportation en cours...</span>
          </div>
        ) : exportCompleted ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {downloadUrl ? (
              <>
                <span className="text-green-400">Export terminé !</span>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
                >
                  Télécharger le code
                </button>
              </>
            ) : (
              <span className="text-red-400">Erreur lors de l&apos;exportation.</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Language Selection */}
            <div className="mb-4">
              <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">
                Langage :
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled // Only .ino for now
                className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:opacity-75"
              >
                <option value=".ino">.ino (Arduino)</option>
              </select>
            </div>

            {/* Code Style Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Style du code :</label>
              <div className="flex flex-col space-y-2">
                <label htmlFor="style-natural" className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    id="style-natural"
                    name="codeStyle"
                    value="natural"
                    checked={style === 'natural'}
                    onChange={() => setStyle('natural')}
                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                  />
                  <span>Code naturel (lisible, commenté)</span>
                </label>
                <label htmlFor="style-compressed" className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    id="style-compressed"
                    name="codeStyle"
                    value="compressed"
                    checked={style === 'compressed'}
                    onChange={() => setStyle('compressed')}
                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                  />
                  <span>Code compressé (optimisé en taille)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExportClick}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
              >
                Exporter
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportCodeModal;
