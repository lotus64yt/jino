"use client";

import Sidebar from '@/components/layout/sidebar/build/Sidebar';
import DropZone, { ComponentProps, DefinedFunction/*, Connection, DroppedComponent*/, DropZoneHandle } from '@/components/build/DropZone';
import { Port } from '@/components/build/GenericBlock';
import React, { useState/*, useEffect*/, useRef } from 'react'; // Added useState, useEffect, useRef
import { getComponentsData } from '@/utils/getComponentsData';
import { useLanguage } from '@/context/LanguageContext';
import NavBar from '@/components/layout/NavBar'; // Import NavBar
import { JinoProject/*, JINO_APP_VERSION*/ } from '@/types/project'; // Import JinoProject and JINO_APP_VERSION

// Types for the raw JSON structure
interface RawPortData {
  portId: string;
  name?: string;
  dataType: string;
  kind: string; // Keep as string, validation/assertion can happen in mapPort or later
  flow: string; // Keep as string
  color?: string;
  providesData?: RawPortData[];
}

interface RawDefaultPorts {
  executionIn?: RawPortData;
  executionOuts?: RawPortData[];
  dataIns?: RawPortData[];
  dataOuts?: RawPortData[];
}

interface RawComponentItem {
  id: string;
  name: string;
  defaultPorts?: RawDefaultPorts;
  documentation?: string;
  // category is part of the parent structure
}

interface RawCategory {
  category: string;
  items: RawComponentItem[];
}

const mapPort = (port: RawPortData): Port | undefined => {
  if (!port) return undefined;
  // Ensure kind and flow are valid for the Port type
  const kind = port.kind as Port['kind'];
  const flow = port.flow as Port['flow'];

  if (!['execution', 'data'].includes(kind)) {
    console.warn(`Invalid port kind: ${kind} for portId: ${port.portId}`);
    // Potentially return undefined or throw error if strictness is required
  }
  if (!['in', 'out'].includes(flow)) {
    console.warn(`Invalid port flow: ${flow} for portId: ${port.portId}`);
     // Potentially return undefined or throw error
  }

  const mappedProvidesData = port.providesData?.map(mapPort).filter((p): p is Port => p !== undefined);

  const result: Port = {
    id: port.portId,
    name: port.name,
    dataType: port.dataType,
    kind: kind,
    flow: flow,
    color: port.color,
    providesData: mappedProvidesData,
  };
  return result;
};

const BuildPage = () => {
  const { lang, t } = useLanguage();
  // Select localized components metadata based on current language
  const typedComponentsData = getComponentsData(lang) as RawCategory[];
  const [definedFunctions, setDefinedFunctions] = useState<DefinedFunction[]>([]);
  const dropZoneRef = useRef<DropZoneHandle>(null); // Use DropZoneHandle here

  const handleDefinedFunctionsChange = (updatedFunctions: DefinedFunction[]) => {
    setDefinedFunctions(updatedFunctions);
  };

  const getProjectDataForSave = (): Omit<JinoProject, 'jinoVersion' | 'lastSaved' | 'projectName'> => {
    if (dropZoneRef.current) {
      const { droppedComponents, connections, definedFunctions: dzDefinedFunctions, definedVariables, zoomLevel, panOffset } = dropZoneRef.current.getProjectState();
      return {
        droppedComponents,
        connections,
        definedFunctions: dzDefinedFunctions,
        definedVariables, // Add definedVariables
        uiState: {
          zoomLevel,
          panOffset,
        },
      };
    }
    return { droppedComponents: [], connections: [], definedFunctions: [], definedVariables: [], uiState: { zoomLevel: 1, panOffset: { x: 0, y: 0 } } }; // Add definedVariables
  };

  const loadProjectData = (project: JinoProject) => {
    if (dropZoneRef.current) {
      dropZoneRef.current.loadProjectState({
        droppedComponents: project.droppedComponents,
        connections: project.connections,
        definedFunctions: project.definedFunctions,
        definedVariables: project.definedVariables, // Add definedVariables
        zoomLevel: project.uiState?.zoomLevel || 1,
        panOffset: project.uiState?.panOffset || { x: 0, y: 0 },
      });
      // Update the global definedFunctions state as well, as DropZone might have updated its internal one
      setDefinedFunctions(project.definedFunctions);
    }
  };

  const allComponents: ComponentProps[] = typedComponentsData.reduce<ComponentProps[]>((acc, category) => {
      const categoryItems = category.items.map((item: RawComponentItem) => {
      const defaultPorts = item.defaultPorts;
      // Localize name via translations (fallback to JSON name)
      const translatedName = t(`components.${item.id}.name`) || item.name;
      const mappedItem: ComponentProps = {
        id: item.id,
        name: translatedName,
        defaultPorts: {
          executionIn: defaultPorts?.executionIn ? mapPort(defaultPorts.executionIn) : undefined,
          executionOuts: defaultPorts?.executionOuts?.map(mapPort).filter((p): p is Port => p !== undefined),
          dataIns: defaultPorts?.dataIns?.map(mapPort).filter((p): p is Port => p !== undefined),
          dataOuts: defaultPorts?.dataOuts?.map(mapPort).filter((p): p is Port => p !== undefined),
        },
        documentation: item.documentation,
        category: category.category,
      };
      return mappedItem;
    });
    acc.push(...categoryItems);
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white"> {/* Added flex-col and h-screen here */}
      <NavBar getProjectDataForSave={getProjectDataForSave} loadProjectData={loadProjectData} />
      <div className="flex flex-grow overflow-hidden"> {/* This div remains to manage Sidebar and DropZone layout */}
        <Sidebar components={allComponents} definedFunctions={definedFunctions} />
        <DropZone 
          ref={dropZoneRef} 
          components={allComponents} 
          onDefinedFunctionsChange={handleDefinedFunctionsChange} 
        />
      </div>
    </div>
  );
};

export default BuildPage;
