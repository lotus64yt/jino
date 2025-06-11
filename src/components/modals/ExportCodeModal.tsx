"use client";

import React, { useState, useEffect } from "react";

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onExport now returns a Promise<string | null> (download URL or null on error)
  onExport: (options: {
    language: string;
    style: "natural" | "compressed";
  }) => Promise<string | null>;
}

const ExportCodeModal: React.FC<ExportCodeModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const [language, setLanguage] = useState<string>(".ino");
  const [style, setStyle] = useState<"natural" | "compressed">("natural");
  const [isLoading, setIsLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null); // To store success or error message

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setExportMessage(null); // Reset message when modal opens
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleExportClick = async () => {
    setIsLoading(true);
    setExportMessage(null);
    try {
      const resultMessage = await onExport({ language, style });
      if (resultMessage) {
        setExportMessage(resultMessage); // Display success message from onExport
      } else {
        setExportMessage(
          "Erreur lors de l'exportation. Le nom du fichier n'a pas été fourni ou une autre erreur est survenue."
        );
      }
    } catch (error) {
      console.error("Export failed in modal:", error);
      setExportMessage(
        "Erreur critique lors de l'exportation: " + (error as Error).message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 text-black">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full z-50 flex flex-col">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Options d&apos;Exportation du Code
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-primary mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V8a4 4 0 00-4 4H4z"
              ></path>{" "}
              {/* Corrected path for better spinner visual */}
            </svg>
            <span className="text-muted-foreground">
              Exportation en cours...
            </span>
          </div>
        ) : exportMessage ? ( // Show message if export has been attempted
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {/* Display the message from exportMessage. It could be success or error. */}
            <span
              className={`text-center ${
                exportMessage.startsWith("Erreur")
                  ? "text-destructive-foreground"
                  : "text-green-400"
              }`}
            >
              {exportMessage}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card-bg transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Language Selection */}
            <div className="mb-4">
              <label
                htmlFor="language-select"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Langage :
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled // Only .ino for now
                className="block w-full px-3 py-2 bg-input-bg border border-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground disabled:opacity-75"
              >
                <option value=".ino">.ino (Arduino)</option>
              </select>
            </div>

            {/* Code Style Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Style du code :
              </label>
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="style-natural"
                  className="flex items-center space-x-2 text-muted-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    id="style-natural"
                    name="codeStyle"
                    value="natural"
                    checked={style === "natural"}
                    onChange={() => setStyle("natural")}
                    className="form-radio h-4 w-4 text-primary bg-input-bg border-input-border focus:ring-primary"
                  />
                  <span>Code naturel (lisible, commenté)</span>
                </label>
                <label
                  htmlFor="style-compressed"
                  className="flex items-center space-x-2 text-muted-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    id="style-compressed"
                    name="codeStyle"
                    value="compressed"
                    checked={style === "compressed"}
                    onChange={() => setStyle("compressed")}
                    className="form-radio h-4 w-4 text-primary bg-input-bg border-input-border focus:ring-primary"
                  />
                  <span>Code compressé (optimisé en taille)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card-bg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExportClick}
                className="px-4 py-2 text-sm font-medium bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card-bg transition-colors"
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
