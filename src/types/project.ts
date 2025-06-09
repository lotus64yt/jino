// src/types/project.ts
import { DroppedComponent as OriginalDroppedComponent, Connection as OriginalConnection, DefinedFunction } from '@/components/build/DropZone';
import { VariableNameConfigData } from '@/components/build/configs/VariableNameConfig'; // Import VariableNameConfigData

export const JINO_APP_VERSION = "0.1.0"; // Current version of the Jino application

// Re-export DroppedComponent and Connection to make them available for the transpiler
// and ensure they are the single source of truth from DropZone.tsx
export type DroppedComponent = OriginalDroppedComponent;
export type Connection = OriginalConnection;

export interface JinoProject {
  jinoVersion: string; // Version of Jino that saved this project
  projectName?: string;
  lastSaved?: string; // ISO 8601 date string
  droppedComponents: DroppedComponent[];
  connections: Connection[];
  definedFunctions: DefinedFunction[];
  definedVariables: VariableNameConfigData[]; // Add definedVariables
  uiState?: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
  };
}
