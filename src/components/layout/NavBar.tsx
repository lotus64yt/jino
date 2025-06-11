// src/components/layout/NavBar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JINO_APP_VERSION, JinoProject } from "@/types/project";
import { transpileProject } from "@/lib/transpiler/transpiler_registry";
import ExportCodeModal from "../modals/ExportCodeModal";
import ArduinoUploader from "../upload/ArduinoUploader"; // Import the new uploader component

// Props for NavBar if it needs to access project data directly or via context
interface NavBarProps {
  getProjectDataForSave: () => Omit<
    JinoProject,
    "jinoVersion" | "lastSaved" | "projectName"
  >; // Function to get current project state
  loadProjectData: (project: JinoProject) => void; // Function to load project data into DropZone
}

type SupportedLanguage = ".ino";

const NavBar: React.FC<NavBarProps> = ({
  getProjectDataForSave,
  loadProjectData,
}) => {
  // const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(
    null
  );
  const [triggerUpload, setTriggerUpload] = useState(false); // New state to trigger upload

  const handleSaveProject = () => {
    const currentProjectData = getProjectDataForSave();
    const projectNameFromPrompt = prompt(
      "Entrez le nom du projet:",
      currentProjectName || "MonProjetJino"
    );
    if (!projectNameFromPrompt) return; // User cancelled
    setCurrentProjectName(projectNameFromPrompt); // Set current project name

    const project: JinoProject = {
      jinoVersion: JINO_APP_VERSION,
      projectName: projectNameFromPrompt,
      lastSaved: new Date().toISOString(),
      ...currentProjectData,
    };

    const jsonData = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectNameFromPrompt}.jino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Projet sauvegardé avec succès!");
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string")
          throw new Error("Erreur de lecture du fichier.");
        const projectData = JSON.parse(text) as JinoProject;

        // Basic validation
        if (
          !projectData.jinoVersion ||
          !projectData.droppedComponents ||
          !projectData.connections ||
          !projectData.definedFunctions
        ) {
          alert("Fichier de projet invalide ou corrompu.");
          return;
        }

        // Here you could add migration logic based on projectData.jinoVersion if needed
        if (projectData.jinoVersion !== JINO_APP_VERSION) {
          console.warn(
            `Projet chargé depuis une version différente de Jino (${projectData.jinoVersion}). Version actuelle: ${JINO_APP_VERSION}. Des migrations pourraient être nécessaires.`
          );
          // Example: if (projectData.jinoVersion === '0.0.1') { projectData = migrateFromV0_0_1(projectData); }
        }

        loadProjectData(projectData);
        setCurrentProjectName(projectData.projectName || null); // Set current project name, ensure it can be null
        alert("Projet chargé avec succès!");
      } catch (error) {
        console.error("Erreur lors du chargement du projet:", error);
        alert(
          "Erreur lors du chargement du projet. Vérifiez la console pour plus de détails."
        );
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
    // setIsExportDropdownOpen(false); // Close dropdown if open
  };

  const handleActualExport = async (options: {
    language: string;
    style: "natural" | "compressed";
  }): Promise<string | null> => {
    try {
      const currentProjectData = getProjectDataForSave();
      const desiredName = prompt(
        "Entrez le nom souhaité pour le fichier (sans extension):",
        "MonProjetJino"
      );

      if (!desiredName) {
        return null; // User cancelled or entered nothing
      }

      const projectForTranspilation: JinoProject = {
        jinoVersion: JINO_APP_VERSION,
        projectName: desiredName,
        lastSaved: new Date().toISOString(),
        ...currentProjectData,
      };

      const fileExtension = options.language;
      const languageForTranspiler = (
        fileExtension.startsWith(".") ? fileExtension : `.${fileExtension}`
      ) as SupportedLanguage;

      const code = transpileProject(
        projectForTranspilation,
        languageForTranspiler,
        { style: options.style }
      );

      const blob = new Blob([code], { type: "text/plain" });
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      const fileName = `${desiredName}${languageForTranspiler}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl); // Clean up the object URL

      // Instead of alert, we return the filename as a success indicator, or a generic success message.
      // The modal can then handle displaying this.
      return `Fichier exporté: ${fileName}`;
    } catch (err) {
      console.error("Erreur lors de l’export du code:", err);
      // Return null or throw error, to be handled by the modal
      // For now, let's make the modal responsible for alerting by returning null
      return null;
    }
  };

  // const handleInitiateUpload = () => {
  //   setIsExportDropdownOpen(false);
  //   setTriggerUpload(true); // Set trigger to true to start upload in ArduinoUploader
  // };

  const handleUploadFinished = () => {
    setTriggerUpload(false); // Reset trigger when upload is done (or modal closed)
  };

  return (
    <>
      <nav className="bg-background/80 backdrop-blur-md text-foreground p-3 shadow-lg flex justify-between items-center h-16 z-50 relative transition-all">
        <div className="flex items-center">
          <Link
            href="/build"
            className="text-2xl font-bold hover:text-primary transition duration-150 ease-in-out transform hover:scale-105"
          >
            Jino Builder
          </Link>
          {/* Future: Add logo <img src="/logo.svg" alt="Jino Logo" className="h-8 w-auto ml-2" /> */}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveProject}
            className="px-4 py-2 rounded-md text-sm font-medium bg-button-primary-bg text-button-primary-text hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
          >
            Sauvegarder
          </button>
          <label className="px-4 py-2 rounded-md text-sm font-medium bg-input-bg text-foreground hover:bg-input-bg/80 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg cursor-pointer">
            Charger
            <input
              type="file"
              accept=".jino"
              className="hidden"
              onChange={handleLoadProject}
            />
          </label>

          {/* Split Button for Export/Upload */}
          <div className="relative">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={openExportModal}
                type="button"
                className="px-4 py-2 bg-button-secondary-bg text-button-secondary-text hover:bg-secondary/80 font-medium rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background transition-colors"
              >
                Exporter Code
              </button>
              {/* <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                type="button"
                className="px-2 py-2 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors border-l"
                aria-haspopup="true"
                aria-expanded={isExportDropdownOpen}
              >
                <span className="sr-only">Ouvrir options</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button> */}
            </div>

            {/* {isExportDropdownOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div className="py-1" role="none">
                  <button
                    onClick={handleInitiateUpload} // Changed to handleInitiateUpload
                    className="text-gray-200 hover:bg-gray-700 hover:text-white block w-full text-left px-4 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Téléverser le code
                  </button>
                </div>
              </div>
            )} */}
          </div>

          <Link
            href="/site"
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
          >
            Accueil Site
          </Link>
        </div>
      </nav>
      <ExportCodeModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleActualExport}
      />
      {/* Conditionally render ArduinoUploader. It manages its own modal. */}
      {triggerUpload && (
        <ArduinoUploader
          getProjectDataForSave={getProjectDataForSave}
          currentProjectName={currentProjectName}
          triggerUpload={triggerUpload} // Pass the trigger
          onUploadFinished={handleUploadFinished} // Callback to reset trigger
        />
      )}
      {/* <UploadStatusModal ... /> */}
      {/* The UploadStatusModal is now rendered inside ArduinoUploader */}
    </>
  );
};

export default NavBar;
