// src/components/layout/NavBar.tsx
"use client";

import React, { useState } from 'react'; // Added useState
import Link from 'next/link';
import { JINO_APP_VERSION, JinoProject } from '@/types/project';
import { transpileProject } from '@/lib/transpiler/transpiler_registry';
import ExportCodeModal from '../modals/ExportCodeModal'; // Import the modal

// Props for NavBar if it needs to access project data directly or via context
interface NavBarProps {
  getProjectDataForSave: () => Omit<JinoProject, 'jinoVersion' | 'lastSaved' | 'projectName'>; // Function to get current project state
  loadProjectData: (project: JinoProject) => void; // Function to load project data into DropZone
}

type SupportedLanguage = ".ino";

const NavBar: React.FC<NavBarProps> = ({ getProjectDataForSave, loadProjectData }) => {
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false); // State for dropdown
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // State for the new modal

  const handleSaveProject = () => {
    const currentProjectData = getProjectDataForSave();
    const projectName = prompt("Entrez le nom du projet:", "MonProjetJino");
    if (!projectName) return; // User cancelled

    const project: JinoProject = {
      jinoVersion: JINO_APP_VERSION,
      projectName,
      lastSaved: new Date().toISOString(),
      ...currentProjectData,
    };

    const jsonData = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.jino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Projet sauvegardé avec succès!');
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Erreur de lecture du fichier.");
        const projectData = JSON.parse(text) as JinoProject;
        
        // Basic validation
        if (!projectData.jinoVersion || !projectData.droppedComponents || !projectData.connections || !projectData.definedFunctions) {
          alert("Fichier de projet invalide ou corrompu.");
          return;
        }

        // Here you could add migration logic based on projectData.jinoVersion if needed
        if (projectData.jinoVersion !== JINO_APP_VERSION) {
          console.warn(`Projet chargé depuis une version différente de Jino (${projectData.jinoVersion}). Version actuelle: ${JINO_APP_VERSION}. Des migrations pourraient être nécessaires.`);
          // Example: if (projectData.jinoVersion === '0.0.1') { projectData = migrateFromV0_0_1(projectData); }
        }

        loadProjectData(projectData);
        alert('Projet chargé avec succès!');
      } catch (error) {
        console.error("Erreur lors du chargement du projet:", error);
        alert("Erreur lors du chargement du projet. Vérifiez la console pour plus de détails.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
    setIsExportDropdownOpen(false); // Close dropdown if open
  };

  // Nouvelle version asynchrone pour l'export
  const handleActualExport = async (options: { language: string; style: 'natural' | 'compressed' }): Promise<string | null> => {
    try {
      // Récupère l'état courant du projet et complète les champs nécessaires
      const currentProjectData = getProjectDataForSave();
      const projectName = prompt("Entrez le nom du projet pour l'export:", "MonProjetJino") || 'MonProjetJino';
      const project: JinoProject = {
        jinoVersion: JINO_APP_VERSION,
        projectName,
        lastSaved: new Date().toISOString(),
        ...currentProjectData,
      };

      // Transpile le projet en code Arduino
      const code = transpileProject(project, (options.language === "ino" ? ".ino" : options.language) as SupportedLanguage, { style: options.style });

      // Crée un blob et une URL de téléchargement
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      return url;
    } catch (err) {
      console.error('Erreur lors de l’export Arduino:', err);
      return null;
    }
  };


  // Téléversement direct Arduino via compilation navigateur et Web Serial
  const handleUploadCode = async () => {
    setIsExportDropdownOpen(false);
    // 1. Générer le code .ino
    let transpileToArduinoIno;
    try {
      transpileToArduinoIno = (await import('@/lib/transpiler/arduino_ino_transpiler')).transpileToArduinoIno;
    } catch /*(e)*/ {
      alert("Erreur: Impossible de charger le transpileur Arduino");
      return;
    }
    const currentProjectData = getProjectDataForSave();
    const projectName = prompt("Nom du projet pour téléversement:", "MonProjetJino") || 'MonProjetJino';
    const project = {
      jinoVersion: JINO_APP_VERSION,
      projectName,
      lastSaved: new Date().toISOString(),
      ...currentProjectData,
    };
    const inoCode = transpileToArduinoIno(project, { style: 'natural' });

    // 2. Envoyer le code à l'API de compilation distante et recevoir le .hex
    let hexData;
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ino: inoCode })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Erreur compilation API: ' + errText);
      }
      hexData = new Uint8Array(await response.arrayBuffer());
    } catch (e) {
      alert("Erreur lors de la compilation via l'API distante.\n" + e);
      return;
    }

    // 3. Demander le port série et envoyer le .hex (protocole STK500 simplifié)
    try {
      // @ts-expect-error: Accessing experimental Web Serial API which is not typed in TypeScript
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      // Il faut ici envoyer le .hex via le protocole STK500 (non trivial)
      // Il existe des libs JS à adapter (avrgirl-arduino, etc.)
      // Pour la démo, on envoie juste les données brutes (ne fonctionnera pas sur une vraie carte sans protocole)
      const writer = port.writable.getWriter();
      await writer.write(hexData);
      writer.releaseLock();
      await port.close();
      alert("Téléversement terminé (simulation, protocole STK500 non implémenté)");
    } catch (e) {
      alert("Erreur lors de l'envoi sur le port série: " + e);
    }
  };

  return (
    <>
      <nav className="bg-background text-foreground p-3 shadow-lg flex justify-between items-center h-16 z-50 relative">
        <div className="flex items-center">
          <Link href="/build" className="text-2xl font-bold hover:text-primary transition-colors duration-150 ease-in-out">
            Jino Builder
          </Link>
          {/* Future: Add logo <img src="/logo.svg" alt="Jino Logo" className="h-8 w-auto ml-2" /> */}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSaveProject}
            className="px-4 py-2 rounded-md text-sm font-medium bg-button-primary-bg text-button-primary-text hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors duration-150 ease-in-out"
          >
            Sauvegarder
          </button>
          <label className="px-4 py-2 rounded-md text-sm font-medium bg-input-bg text-foreground hover:bg-input-bg/80 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition-colors duration-150 ease-in-out cursor-pointer">
            Charger
            <input type="file" accept=".jino" className="hidden" onChange={handleLoadProject} />
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
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                type="button"
                className="px-2 py-2 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors border-l"
                aria-haspopup="true"
                aria-expanded={isExportDropdownOpen}
              >
                <span className="sr-only">Ouvrir options</span>
                {/* Heroicon: chevron-down (simple SVG for dropdown arrow) */}
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {isExportDropdownOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div className="py-1" role="none">
                  <button
                    onClick={handleUploadCode}
                    className="text-gray-200 hover:bg-gray-700 hover:text-white block w-full text-left px-4 py-2 text-sm transition-colors"
                    role="menuitem"
                  >
                    Téléverser le code
                  </button>
                </div>
              </div>
            )}
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
    </>
  );
};

export default NavBar;
