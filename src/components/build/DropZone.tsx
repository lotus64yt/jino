"use client";

import React, { useState, useRef, useEffect, useCallback, DragEvent, forwardRef, useImperativeHandle } from 'react';
import DropZoneControlButtons from './DropZoneControlButtons';
import TrashCan from './TrashCan';
import GenericBlock, { Port, BlockConfig } from './GenericBlock';
import BlockConfigurationModal from './modals/BlockConfigurationModal';

// Config component imports
import LedConfig, { LedConfigData } from './configs/LedConfig';
import DelayConfig, { DelayConfigData } from './configs/DelayConfig';
import ConstantNumberConfig, { ConstantNumberConfigData } from './configs/ConstantNumberConfig';
import ConstantStringConfig, { ConstantStringConfigData } from './configs/ConstantStringConfig';
import ConstantBooleanConfig, { ConstantBooleanConfigData } from './configs/ConstantBooleanConfig';
import ConstantArrayConfig, { ConstantArrayConfigData } from './configs/ConstantArrayConfig'; // Changed ConstantArrayValue to ConstantArrayConfigData
import VariableNameConfig, { VariableNameConfigData } from './configs/VariableNameConfig'; // Import VariableNameConfigData
import FunctionDefinitionConfig, { FunctionDefinitionConfigData, FunctionParameter } from './configs/FunctionDefinitionConfig';
import LogicOperationConfig, { LogicOperationConfigData } from './configs/LogicOperationConfig';
import { useLanguage } from '@/context/LanguageContext';
import { getComponentsData } from '@/utils/getComponentsData';

// Define BlockConfigData union type earlier so it can be used by ComponentProps
export type BlockConfigData =
  | LedConfigData
  | DelayConfigData
  | ConstantNumberConfigData
  | ConstantStringConfigData
  | ConstantBooleanConfigData
  | ConstantArrayConfigData // Changed ConstantArrayValue to ConstantArrayConfigData
  | VariableNameConfigData // Use VariableNameConfigData
  | FunctionDefinitionConfigData
  | LogicOperationConfigData
  | Record<string, unknown>; // Fallback for truly dynamic/unknown configs from JSON

// Raw port data structure from JSON (as dragged from Sidebar)
interface RawPortData {
  portId: string;
  name?: string;
  dataType: string;
  kind: 'execution' | 'data';
  flow: 'in' | 'out';
  color?: string;
  providesData?: RawPortData[];
}

// Helper function to map Jino data types to port data types
const mapJinoDataTypeToPortType = (jinoDataType: string | undefined): string => {
  switch (jinoDataType) {
    case 'Nombre':
      return 'number';
    case 'Texte':
      return 'string';
    case 'Booléen':
      return 'boolean';
    case 'Tableau':
      return 'array';
    default:
      return 'any'; // Or a more specific default/error handling
  }
};

interface RawDefaultPorts {
  executionIn?: RawPortData;
  executionOuts?: RawPortData[];
  dataIns?: RawPortData[];
  dataOuts?: RawPortData[];
}

// Raw component item structure from JSON (as dragged from Sidebar)
// This is what's expected from the drag operation
interface RawComponentItem {
  id: string;
  name: string;
  defaultPorts?: RawDefaultPorts;
  documentation?: string;
  category?: string;
  configComponent?: string;
  defaultConfig?: Record<string, unknown>; // defaultConfig from JSON is unknown structure
}

// Props for components coming from the sidebar (components.json)
// This interface is used for the `components` prop, which is pre-processed in page.tsx
export interface ComponentProps {
  id: string;
  name: string;
  defaultPorts?: {
    executionIn?: Port;
    executionOuts?: Port[];
    dataIns?: Port[];
    dataOuts?: Port[];
  };
  documentation?: string;
  category?: string;
  configComponent?: string;
  defaultConfig?: BlockConfigData; // Processed defaultConfig, typed with our union
}

// Component dropped onto the canvas
export interface DroppedComponent {
  id: string; // Original component ID (from ComponentProps)
  instanceId: string; // Unique ID for this instance
  name: string;
  top: number;
  left: number;
  ports: {
    executionIn?: Port;
    executionOuts?: Port[];
    dataIns?: Port[];
    dataOuts?: Port[];
  };
  config?: BlockConfigData; // Use the defined union type
  documentation?: string;
}

export interface Connection { // Added export
  id: string;
  fromBlockInstanceId: string;
  fromPortId: string;
  toBlockInstanceId: string;
  toPortId: string;
  type: 'execution' | 'data';
}

interface ConnectingPortInfo {
  blockInstanceId: string;
  port: Port;
  portDomElement: HTMLDivElement;
}

// Structure for defined functions
export interface DefinedFunction {
  id: string; // Unique ID for the function definition, e.g., derived from instanceId of start block
  name: string;
  parameters: FunctionParameter[]; // Use FunctionParameter here
  returnType?: string; // Optional return type for function
  startBlockInstanceId: string; // Instance ID of the function_definition_start block
}

// Define the handle type for useImperativeHandle
export interface DropZoneHandle {
  getProjectState: () => {
    droppedComponents: DroppedComponent[];
    connections: Connection[];
    definedFunctions: DefinedFunction[];
    definedVariables: VariableNameConfigData[]; // Added definedVariables
    zoomLevel: number;
    panOffset: { x: number; y: number };
  };
  loadProjectState: (state: {
    droppedComponents: DroppedComponent[];
    connections: Connection[];
    definedFunctions: DefinedFunction[];
    definedVariables?: VariableNameConfigData[]; // Added definedVariables as optional
    zoomLevel: number;
    panOffset: { x: number; y: number };
  }) => void;
}

// Props for the DropZone itself
interface DropZoneProps {
  components: ComponentProps[]; // These are the definitions from components.json, processed
  onDefinedFunctionsChange: (functions: DefinedFunction[]) => void;
}

const DropZone = forwardRef<DropZoneHandle, DropZoneProps>(({ components: sidebarComponents, onDefinedFunctionsChange }, ref) => {
  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dropZoneRefInternal = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanMousePosition, setLastPanMousePosition] = useState({ x: 0, y: 0 });
  const [connectingPort, setConnectingPort] = useState<ConnectingPortInfo | null>(null);
  const [tempWirePosition, setTempWirePosition] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [configuringBlock, setConfiguringBlock] = useState<{ instanceId: string; blockId: string } | null>(null);
  const [definedFunctions, setDefinedFunctions] = useState<DefinedFunction[]>([]);
  const [draggingBlockInstanceId, setDraggingBlockInstanceId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [definedVariables, setDefinedVariables] = useState<VariableNameConfigData[]>([]); // State for defined variables

  const { lang } = useLanguage();
  const categorizedComponents = getComponentsData(lang);

  useImperativeHandle(ref, () => ({
    getProjectState: () => ({
      droppedComponents,
      connections,
      definedFunctions,
      definedVariables, // Include definedVariables in project state
      zoomLevel,
      panOffset,
    }),
    loadProjectState: (state) => {
      setDroppedComponents(state.droppedComponents);
      setConnections(state.connections);
      setDefinedFunctions(state.definedFunctions);
      setDefinedVariables(state.definedVariables || []); // Load definedVariables, default to empty array
      setZoomLevel(state.zoomLevel);
      setPanOffset(state.panOffset);
    },
  }));

  useEffect(() => {
    onDefinedFunctionsChange(definedFunctions);
  }, [definedFunctions, onDefinedFunctionsChange]);

  const getWireColor = (dataType: string): string => {
    switch (dataType) {
      case 'number': return '#7dd3fc';
      case 'string': return '#c4b5fd';
      case 'boolean': return '#fde047';
      case 'array': return '#86efac';
      case 'execution': return '#d1d5db';
      default: return '#9ca3af';
    }
  };

  const mapRawPortToPort = (rawPort: RawPortData): Port => {
    const mappedProvidesData = rawPort.providesData?.map(p => mapRawPortToPort(p));
    return {
      id: rawPort.portId,
      name: rawPort.name || rawPort.portId,
      dataType: rawPort.dataType,
      kind: rawPort.kind,
      flow: rawPort.flow,
      color: rawPort.color,
      ...(mappedProvidesData && mappedProvidesData.length > 0 && { providesData: mappedProvidesData }),
    };
  };

  const handleSaveBlockConfiguration = (instanceId: string, newConfigData: Partial<BlockConfigData>) => {
    let oldVariableName: string | undefined = undefined;
    let isVariableSetBlock = false;

    setDroppedComponents(prev =>
      prev.map(c => {
        if (c.instanceId === instanceId) {
          const updatedConfig = { ...c.config, ...newConfigData } as BlockConfigData;
          const updatedBlock = { ...c, config: updatedConfig }; // Changed to const

          if (updatedBlock.id === 'variable_set') {
            isVariableSetBlock = true;
            const varConfig = updatedBlock.config as VariableNameConfigData;
            // Store old name if it's different and was previously set
            if (c.config && (c.config as VariableNameConfigData).name && (c.config as VariableNameConfigData).name !== varConfig.name) {
                oldVariableName = (c.config as VariableNameConfigData).name;
            }

            if (varConfig && varConfig.name && varConfig.dataType) {
              // Update definedVariables
              setDefinedVariables(prevVars => {
                const existingVarIndex = prevVars.findIndex(v => v.name === varConfig.name);
                const newVarData: VariableNameConfigData = { name: varConfig.name, dataType: varConfig.dataType, isNew: false }; // isNew is processed, then set to false

                if (varConfig.isNew && existingVarIndex === -1) { // New variable being defined
                  return [...prevVars, newVarData];
                } else if (existingVarIndex > -1) { // Existing variable, potentially type change (though UI prevents this for now)
                  const updatedVars = [...prevVars];
                  updatedVars[existingVarIndex] = newVarData;
                  return updatedVars;
                } else if (!varConfig.isNew && existingVarIndex === -1 && oldVariableName && oldVariableName !== varConfig.name) {
                    // This handles a rename of an existing variable
                    // Remove old, add new
                    const varsWithoutOld = prevVars.filter(v => v.name !== oldVariableName);
                    return [...varsWithoutOld, newVarData];
                } else if (!varConfig.isNew && existingVarIndex > -1) {
                    // Selected an existing variable, ensure its type is reflected (should already be)
                    const updatedVars = [...prevVars];
                    updatedVars[existingVarIndex] = newVarData; // Ensure data is up-to-date
                    return updatedVars;
                }
                return prevVars; // No change if conditions not met
              });

              // Dynamically update port type for variable_set
              if (updatedBlock.ports.dataIns && updatedBlock.ports.dataIns.length > 0) {
                updatedBlock.ports.dataIns[0].dataType = mapJinoDataTypeToPortType(varConfig.dataType);
              }
            }
          } else if (updatedBlock.id === 'variable_get') {
            const varConfig = updatedBlock.config as VariableNameConfigData;
            if (varConfig && varConfig.dataType) {
              // Dynamically update port type for variable_get
              if (updatedBlock.ports.dataOuts && updatedBlock.ports.dataOuts.length > 0) {
                updatedBlock.ports.dataOuts[0].dataType = mapJinoDataTypeToPortType(varConfig.dataType);
              }
            }
          }
          // REMOVE OLD VARIABLE BLOCK LOGIC from handleSaveBlockConfiguration
          // if (updatedBlock.id.startsWith('variable_set_')) { ... }

          if (updatedBlock.id === 'function_definition_start') {
            const funcConfig = updatedBlock.config as FunctionDefinitionConfigData;
            if (funcConfig && Array.isArray(funcConfig.params)) {
              const newParameterPorts: Port[] = funcConfig.params.map(param => ({
                id: param.id,
                name: param.name,
                dataType: param.dataType,
                kind: 'data',
                flow: 'out'
              }));
              updatedBlock.ports = { ...updatedBlock.ports, dataOuts: newParameterPorts };
            }
          } else if (updatedBlock.id === 'logic_operation') {
            const logicConfig = updatedBlock.config as LogicOperationConfigData;
            // Ensure numInputs is valid after config change (LogicOperationConfig should handle this primarily)
            if (logicConfig && typeof logicConfig.numInputs === 'number' && logicConfig.operator) {
                const validatedNumInputs = logicConfig.operator === 'NOT' ? 1 : Math.max(2, logicConfig.numInputs);
                const newInputs: Port[] = [];
                for (let i = 0; i < validatedNumInputs; i++) {
                    newInputs.push({
                    id: `operand_${i + 1}`,
                    name: logicConfig.operator === 'NOT' ? 'In' : `In ${i + 1}`,
                    dataType: 'boolean',
                    kind: 'data',
                    flow: 'in'
                    });
                }
                updatedBlock.ports = { ...updatedBlock.ports, dataIns: newInputs };
                // Ensure the config itself reflects the validated numInputs if it changed
                if (logicConfig.numInputs !== validatedNumInputs) {
                    updatedBlock.config = { ...logicConfig, numInputs: validatedNumInputs };
                }
            }
          }
          return updatedBlock;
        }
        return c;
      })
    );

    if (isVariableSetBlock && oldVariableName) {
        setDefinedVariables(prevVars => {
            const isOldVarNameStillUsed = prevVars.some(v => v.name === oldVariableName) || 
                                        droppedComponents.some(dc => 
                                            dc.id === 'variable_set' && 
                                            (dc.config as VariableNameConfigData)?.name === oldVariableName &&
                                            dc.instanceId !== instanceId // Exclude the block being modified if its name didn't change to oldVariableName
                                        );
            if (!isOldVarNameStillUsed) {
                return prevVars.filter(v => v.name !== oldVariableName);
            }
            return prevVars;
        });
    }

    const configuredBlock = droppedComponents.find(c => c.instanceId === instanceId);
    if (configuredBlock && configuredBlock.id === 'function_definition_start') {
      const funcConfig = configuredBlock.config as FunctionDefinitionConfigData;
      if (funcConfig) {
        setDefinedFunctions(prevFuncs => {
          const existingFuncIndex = prevFuncs.findIndex(f => f.startBlockInstanceId === instanceId);
          const updatedFunc: DefinedFunction = {
            id: `func-${instanceId}`,
            name: funcConfig.name || 'maFonction',
            parameters: funcConfig.params || [],
            // returnType: funcConfig.returnType || undefined, // Removed because FunctionDefinitionConfigData has no returnType
            startBlockInstanceId: instanceId,
          };
          if (existingFuncIndex > -1) {
            const updatedFuncsArray = [...prevFuncs];
            updatedFuncsArray[existingFuncIndex] = updatedFunc;
            return updatedFuncsArray;
          } else {
            return [...prevFuncs, updatedFunc];
          }
        });
      }
    }
  };

  const getBlockConfigurationUI = (
    blockInstanceId: string,
    blockDefinitionId: string,
    currentBlockConfig: BlockConfigData | undefined,
    // sidebarComponents are the processed ComponentProps from components.json
    allAvailableComponents: ComponentProps[] 
  ) => {
    const componentDefinition = allAvailableComponents.find(c => c.id === blockDefinitionId);
    if (!componentDefinition) return <p>Configuration non disponible.</p>;

    // Ensure commonOnSave passes Partial<SpecificConfigData>
    const commonOnSave = (newPartialConfig: Partial<BlockConfigData>) => {
      handleSaveBlockConfiguration(blockInstanceId, newPartialConfig);
    };

    switch (blockDefinitionId) {
      case 'digital_write':
      case 'definir_etat_pin':
        return <LedConfig 
          initialData={currentBlockConfig as LedConfigData}
          onSave={commonOnSave as (newConfig: Partial<LedConfigData>) => void}
          instanceId={blockInstanceId}
        />;
      case 'delay_ms':
        return <DelayConfig 
          initialData={currentBlockConfig as DelayConfigData}
          onSave={commonOnSave as (newConfig: Partial<DelayConfigData>) => void}
          instanceId={blockInstanceId}
        />;
      case 'constant_number':
        return <ConstantNumberConfig 
          initialData={currentBlockConfig as ConstantNumberConfigData}
          onSave={commonOnSave as (newConfig: Partial<ConstantNumberConfigData>) => void}
          instanceId={blockInstanceId}
        />;
      case 'constant_string':
        return <ConstantStringConfig 
          initialData={currentBlockConfig as ConstantStringConfigData}
          onSave={commonOnSave as (newConfig: Partial<ConstantStringConfigData>) => void}
          instanceId={blockInstanceId}
        />;
      case 'constant_boolean':
        return <ConstantBooleanConfig 
          initialData={currentBlockConfig as ConstantBooleanConfigData}
          onSave={commonOnSave as (newConfig: Partial<ConstantBooleanConfigData>) => void}
          instanceId={blockInstanceId}
        />;
      case 'constant_array':
        // Ensure the value passed to ConstantArrayConfig is correctly typed or handled by it.
        // ConstantArrayConfig expects `config` of type `ConstantArrayConfigData`
        return <ConstantArrayConfig 
          config={currentBlockConfig as ConstantArrayConfigData || { value: [] }} // Changed initialData to config, ensure default
          onConfigChange={commonOnSave as (newConfig: Partial<ConstantArrayConfigData>) => void}
          blockId={blockInstanceId}
        />;
      case 'variable_set': // Consolidated block
      case 'variable_get': // Consolidated block
        return <VariableNameConfig
          config={currentBlockConfig as VariableNameConfigData || { name: 'maVariable', dataType: 'Nombre', isNew: blockDefinitionId === 'variable_set' ? true : undefined }}
          onConfigChange={commonOnSave as (newConfig: Partial<VariableNameConfigData>) => void}
          blockId={blockInstanceId}
          blockName={componentDefinition.name}
          existingVariables={definedVariables} // Pass full VariableNameConfigData objects
          isSetter={blockDefinitionId === 'variable_set'}
        />;
      case 'function_definition_start':
        return <FunctionDefinitionConfig
          initialData={currentBlockConfig as FunctionDefinitionConfigData || { name: 'nouvelleFonction', params: [] }}
          onConfigChange={commonOnSave as (newConfig: Partial<FunctionDefinitionConfigData>) => void}
          blockId={blockInstanceId}
        />;
      case 'logic_operation': {
        const defaultLogicConfigFromDefinition = componentDefinition.defaultConfig as LogicOperationConfigData | undefined;
        const currentLogicConfig = currentBlockConfig as LogicOperationConfigData | undefined;

        const initialOperator = currentLogicConfig?.operator || defaultLogicConfigFromDefinition?.operator || 'AND'; // Changed let to const
        let initialNumInputs = currentLogicConfig?.numInputs ?? defaultLogicConfigFromDefinition?.numInputs ?? 2;

        if (initialOperator === 'NOT') {
            initialNumInputs = 1;
        } else {
            initialNumInputs = Math.max(2, initialNumInputs);
        }

        const initialData: LogicOperationConfigData = { // Changed let to const
            operator: initialOperator,
            numInputs: initialNumInputs,
        };

        return <LogicOperationConfig
          initialData={initialData}
          onConfigChange={commonOnSave as (newConfig: Partial<LogicOperationConfigData>) => void}
        />;
      }
      default:
        return <p>Ce bloc n&apos;a pas de configuration spécifique.</p>;
    }
  };

  const handleOpenConfiguration = (instanceId: string, blockId: string) => {
    setConfiguringBlock({ instanceId, blockId });
  };

  const handleCloseConfiguration = () => {
    setConfiguringBlock(null);
  };
  
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rawComponentData = event.dataTransfer.getData("application/json");
    if (!rawComponentData) return;

    let rawComponent: RawComponentItem;
    try {
      rawComponent = JSON.parse(rawComponentData) as RawComponentItem;
    } catch (error) { console.error("Failed to parse dragged data:", error); return; }

    if (!rawComponent || !rawComponent.id) { console.error("Dragged data is missing 'id' property:", rawComponent); return; }
    
    if (!dropZoneRefInternal.current || !contentWrapperRef.current) return;
    const contentWrapperRect = contentWrapperRef.current.getBoundingClientRect();
    const x = (event.clientX - contentWrapperRect.left) / zoomLevel;
    const y = (event.clientY - contentWrapperRect.top) / zoomLevel;
    const instanceId = `${rawComponent.id}-${Date.now()}`;

    const initializedPorts: DroppedComponent['ports'] = {};
    if (rawComponent.defaultPorts?.executionIn) initializedPorts.executionIn = mapRawPortToPort(rawComponent.defaultPorts.executionIn);
    if (rawComponent.defaultPorts?.executionOuts) initializedPorts.executionOuts = rawComponent.defaultPorts.executionOuts.map(mapRawPortToPort);
    if (rawComponent.defaultPorts?.dataOuts) initializedPorts.dataOuts = rawComponent.defaultPorts.dataOuts.map(mapRawPortToPort);

    let newComponentConfigData: BlockConfigData = rawComponent.defaultConfig ? JSON.parse(JSON.stringify(rawComponent.defaultConfig)) : {};

    switch (rawComponent.id) {
      case 'digital_write': 
      case 'definir_etat_pin': {
        const baseConf = newComponentConfigData as Partial<LedConfigData>; 
        newComponentConfigData = {
          pin: baseConf.pin ?? 13,
          state: baseConf.state ?? 'HIGH',
        } as LedConfigData;
        break;
      }
      case 'delay_ms': {
        const baseConf = newComponentConfigData as Partial<DelayConfigData>;
        newComponentConfigData = { duration: baseConf.duration ?? 1000 } as DelayConfigData;
        break;
      }
      case 'constant_number': {
        const baseConf = newComponentConfigData as Partial<ConstantNumberConfigData>;
        newComponentConfigData = { value: baseConf.value ?? 0 } as ConstantNumberConfigData;
        break;
      }
      case 'constant_string': {
        const baseConf = newComponentConfigData as Partial<ConstantStringConfigData>;
        newComponentConfigData = { value: baseConf.value ?? "texte" } as ConstantStringConfigData;
        break;
      }
      case 'constant_boolean': {
        const baseConf = newComponentConfigData as Partial<ConstantBooleanConfigData>;
        newComponentConfigData = { value: baseConf.value ?? true } as ConstantBooleanConfigData;
        break;
      }
      case 'constant_array': {
        const baseConf = newComponentConfigData as Partial<ConstantArrayConfigData>; 
        newComponentConfigData = { value: baseConf.value ?? [] } as ConstantArrayConfigData;
        break;
      }
      case 'variable_set': 
      case 'variable_get': 
      {
        const baseConf = newComponentConfigData as Partial<VariableNameConfigData>;
        const defaultConfigForVar = rawComponent.defaultConfig as Partial<VariableNameConfigData> | undefined;
        const defaultDataType = defaultConfigForVar?.dataType || 'Nombre';

        newComponentConfigData = {
          name: baseConf.name ?? 'maVariable',
          isNew: rawComponent.id === 'variable_set' ? (baseConf.isNew ?? true) : undefined,
          dataType: baseConf.dataType ?? defaultDataType,
        } as VariableNameConfigData;

        if ('dataType' in newComponentConfigData && newComponentConfigData.dataType) {
            const portDataType = mapJinoDataTypeToPortType(newComponentConfigData.dataType);
            if (rawComponent.id === 'variable_set' && initializedPorts.dataIns && initializedPorts.dataIns.length > 0) {
              initializedPorts.dataIns[0].dataType = portDataType;
            } else if (rawComponent.id === 'variable_get' && initializedPorts.dataOuts && initializedPorts.dataOuts.length > 0) {
              initializedPorts.dataOuts[0].dataType = portDataType;
            }
        }
        break;
      }
      case 'function_definition_start': {
        const baseConf = newComponentConfigData as Partial<FunctionDefinitionConfigData>;
        newComponentConfigData = {
          name: baseConf.name ?? 'nouvelleFonction',
          params: baseConf.params ?? [],
        } as FunctionDefinitionConfigData;
        break;
      }
      case 'logic_operation': {
        const baseConf = newComponentConfigData as Partial<LogicOperationConfigData>; 
        const operator = baseConf.operator || 'AND';
        let numInputs = baseConf.numInputs === undefined ? 2 : baseConf.numInputs;
        
        if (operator === 'NOT') numInputs = 1;
        else numInputs = Math.max(2, numInputs);
        
        newComponentConfigData = { operator, numInputs } as LogicOperationConfigData;

        const dynamicDataIns: Port[] = [];
        for (let i = 0; i < numInputs; i++) {
          dynamicDataIns.push({
            id: `operand_${i + 1}`,
            name: operator === 'NOT' ? 'In' : `In ${i + 1}`,
            dataType: 'boolean', kind: 'data', flow: 'in'
          });
        }
        initializedPorts.dataIns = dynamicDataIns;
        break;
      }
      default:
        // For other blocks, newComponentConfigData already holds the defaultConfig from components.json
        break;
    }

    // Default dataIns if not set by specific logic (like logic_operation)
    if (!initializedPorts.dataIns && rawComponent.defaultPorts?.dataIns) {
      initializedPorts.dataIns = rawComponent.defaultPorts.dataIns.map(mapRawPortToPort);
    }

    const newComponent: DroppedComponent = {
      id: rawComponent.id,
      instanceId,
      name: rawComponent.name,
      top: y, left: x,
      ports: initializedPorts,
      config: newComponentConfigData,
      documentation: rawComponent.documentation || "Aucune documentation disponible."
    };
    setDroppedComponents((prev) => [...prev, newComponent]);
  };

  const handleMouseDownOnBlock = (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation(); 
    const block = droppedComponents.find(comp => comp.instanceId === instanceId);
    if (!block || !contentWrapperRef.current) return;
    setDraggingBlockInstanceId(instanceId);
    const contentRect = contentWrapperRef.current.getBoundingClientRect();
    const initialMouseX = (e.clientX - contentRect.left) / zoomLevel;
    const initialMouseY = (e.clientY - contentRect.top) / zoomLevel;
    setDragStartOffset({ x: initialMouseX - block.left, y: initialMouseY - block.top });
  };

  const handleMouseMoveForBlockDrag = useCallback((e: MouseEvent) => {
    if (!draggingBlockInstanceId || !contentWrapperRef.current) return;
    const contentRect = contentWrapperRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - contentRect.left) / zoomLevel;
    const mouseY = (e.clientY - contentRect.top) / zoomLevel;
    const newLeft = mouseX - dragStartOffset.x;
    const newTop = mouseY - dragStartOffset.y;
    setDroppedComponents(prev =>
      prev.map(comp =>
        comp.instanceId === draggingBlockInstanceId ? { ...comp, left: newLeft, top: newTop } : comp
      )
    );
  }, [draggingBlockInstanceId, dragStartOffset, zoomLevel]);

  const handleMouseUpForBlockDrag = useCallback(() => {
    setDraggingBlockInstanceId(null);
  }, []);

  const handleMouseDownOnDropZone = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === contentWrapperRef.current || e.target === dropZoneRefInternal.current) {
        setIsPanning(true);
        setLastPanMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMoveForPan = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPanMousePosition.x;
    const dy = e.clientY - lastPanMousePosition.y;
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPanMousePosition({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastPanMousePosition]);

  const handleMouseUpForPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // e.preventDefault(); // Removed to avoid passive event listener error
    const scaleAmount = 1.1;
    const dzRect = dropZoneRefInternal.current?.getBoundingClientRect();
    if (!dzRect) return;
    const mouseX = e.clientX - dzRect.left;
    const mouseY = e.clientY - dzRect.top;
    const newZoom = e.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const zoomFactor = newZoom / zoomLevel;
    setPanOffset(prev => ({ x: mouseX - (mouseX - prev.x) * zoomFactor, y: mouseY - (mouseY - prev.y) * zoomFactor }));
    setZoomLevel(newZoom);
  };

  const getPortCenter = (blockInstanceId: string, portId: string) => {
    if (!contentWrapperRef.current) return null;
    const portElement = contentWrapperRef.current.querySelector(
      `[data-instance-id="${blockInstanceId}"] [data-port-id="${portId}"]`
    ) as HTMLDivElement;
    const blockElement = contentWrapperRef.current.querySelector(
        `[data-instance-id="${blockInstanceId}"]`
    ) as HTMLDivElement;
    if (!portElement || !blockElement) return null;
    const blockData = droppedComponents.find(b => b.instanceId === blockInstanceId);
    if (!blockData) return null;
    const portRect = portElement.getBoundingClientRect();
    const blockRect = blockElement.getBoundingClientRect(); 
    const portCenterXInBlockUnscaled = (portRect.left - blockRect.left + portRect.width / 2) / zoomLevel;
    const portCenterYInBlockUnscaled = (portRect.top - blockRect.top + portRect.height / 2) / zoomLevel;
    return { x: blockData.left + portCenterXInBlockUnscaled, y: blockData.top + portCenterYInBlockUnscaled }; 
  };

  const handlePortClick = (blockInstanceId: string, port: Port, portDomElement: HTMLDivElement) => {
    const portCenter = getPortCenter(blockInstanceId, port.id);
    if (!portCenter) return;

    if (!connectingPort) {
      setConnectingPort({ blockInstanceId, port, portDomElement });
      setTempWirePosition({ x1: portCenter.x, y1: portCenter.y, x2: portCenter.x, y2: portCenter.y });
    } else {
      if (connectingPort.blockInstanceId === blockInstanceId && connectingPort.port.id === port.id) {
        setConnectingPort(null); setTempWirePosition(null); return;
      }
      const fromP = connectingPort.port; 
      const toP = port;
      const validExec = fromP.kind === 'execution' && toP.kind === 'execution' && fromP.flow === 'out' && toP.flow === 'in';
      const validData = fromP.kind === 'data' && toP.kind === 'data' && fromP.flow !== toP.flow &&
                        (fromP.dataType === toP.dataType || fromP.dataType === 'any' || toP.dataType === 'any');

      if (validExec || validData) {
        const newConnection = {
          id: `conn-${Date.now()}`,
          fromBlockInstanceId: connectingPort.blockInstanceId,
          fromPortId: fromP.id,
          toBlockInstanceId: blockInstanceId,
          toPortId: toP.id,
          type: fromP.kind,
        };
        setConnections(prev => [...prev, newConnection]);
      }
      setConnectingPort(null); setTempWirePosition(null);
    }
  };

  const handleMouseMoveForWire = useCallback((e: MouseEvent) => {
    if (!connectingPort || !tempWirePosition || !contentWrapperRef.current) return;
    const contentRect = contentWrapperRef.current.getBoundingClientRect();
    const currentX = (e.clientX - contentRect.left) / zoomLevel;
    const currentY = (e.clientY - contentRect.top) / zoomLevel;
    setTempWirePosition({ ...tempWirePosition, x2: currentX, y2: currentY });
  }, [connectingPort, tempWirePosition, zoomLevel]);

  useEffect(() => {
    const mmBlock = handleMouseMoveForBlockDrag;
    const muBlock = handleMouseUpForBlockDrag;
    const mmPan = handleMouseMoveForPan;
    const muPan = handleMouseUpForPan;
    const mmWire = handleMouseMoveForWire;

    if (draggingBlockInstanceId) {
      document.addEventListener('mousemove', mmBlock);
      document.addEventListener('mouseup', muBlock);
    } else {
      document.removeEventListener('mousemove', mmBlock);
      document.removeEventListener('mouseup', muBlock);
    }
    if (isPanning) {
      document.addEventListener('mousemove', mmPan);
      document.addEventListener('mouseup', muPan);
    } else {
      document.removeEventListener('mousemove', mmPan);
      document.removeEventListener('mouseup', muPan);
    }
    if (connectingPort) {
      document.addEventListener('mousemove', mmWire);
    } else {
      document.removeEventListener('mousemove', mmWire);
    }
    return () => {
      document.removeEventListener('mousemove', mmBlock);
      document.removeEventListener('mouseup', muBlock);
      document.removeEventListener('mousemove', mmPan);
      document.removeEventListener('mouseup', muPan);
      document.removeEventListener('mousemove', mmWire);
    };
  }, [draggingBlockInstanceId, isPanning, connectingPort, handleMouseMoveForBlockDrag, handleMouseUpForBlockDrag, handleMouseMoveForPan, handleMouseUpForPan, handleMouseMoveForWire]);

  const handleDeleteBlock = (instanceId: string) => {
    const blockBeingDeleted = droppedComponents.find(c => c.instanceId === instanceId);
    setDroppedComponents(prev => prev.filter(c => c.instanceId !== instanceId));
    setConnections(prev => prev.filter(conn => conn.fromBlockInstanceId !== instanceId && conn.toBlockInstanceId !== instanceId));
    
    if (blockBeingDeleted) {
      if (blockBeingDeleted.id === 'function_definition_start') {
        setDefinedFunctions(prevFuncs => prevFuncs.filter(f => f.startBlockInstanceId !== instanceId));
      }
      
      if (blockBeingDeleted.id === 'variable_set') {
        const varConfig = blockBeingDeleted.config as VariableNameConfigData;
        if (varConfig && varConfig.name) {
          setDefinedVariables(prevVars => {
            // Check if any other variable_set block defines the same variable name
            const isVarStillDefined = droppedComponents.some(
              c => c.instanceId !== instanceId && 
                   c.id === 'variable_set' && 
                   (c.config as VariableNameConfigData)?.name === varConfig.name
            );
            if (!isVarStillDefined) {
              return prevVars.filter(v => v.name !== varConfig.name);
            }
            return prevVars;
          });
        }
      }
      // REMOVE OLD VARIABLE BLOCK LOGIC from handleDeleteBlock
      // if (blockBeingDeleted.id.startsWith('variable_set_')) { ... }
    }
  };

  const autoFit = () => {
    if (droppedComponents.length === 0 || !dropZoneRefInternal.current || !contentWrapperRef.current) { // Added !contentWrapperRef.current check
        setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const defaultBlockW = 180, defaultBlockH = 120, padding = 50;
    
    droppedComponents.forEach(c => {
        minX = Math.min(minX, c.left);
        minY = Math.min(minY, c.top);
        const currentBlockElement = contentWrapperRef.current?.querySelector(`[data-instance-id=\"${c.instanceId}\"]`);
        const blockRect = currentBlockElement?.getBoundingClientRect(); // Store rect
        const currentBlockWidth = blockRect ? blockRect.width / zoomLevel : defaultBlockW;
        const currentBlockHeight = blockRect ? blockRect.height / zoomLevel : defaultBlockH;
        maxX = Math.max(maxX, c.left + currentBlockWidth);
        maxY = Math.max(maxY, c.top + currentBlockHeight);
    });
    const contentW = maxX - minX;
    const contentH = maxY - minY;

    if (contentW <= 0 || contentH <= 0) {
        setZoomLevel(1);
        let singleBlockX = 0;
        let singleBlockY = 0;

        if (droppedComponents.length === 1 && contentWrapperRef.current) {
            const firstBlockElement = contentWrapperRef.current.querySelector(`[data-instance-id=\"${droppedComponents[0].instanceId}\"]`);
            const firstBlockRect = firstBlockElement?.getBoundingClientRect();
            const firstBlockWidth = firstBlockRect ? firstBlockRect.width / zoomLevel : defaultBlockW;
            const firstBlockHeight = firstBlockRect ? firstBlockRect.height / zoomLevel : defaultBlockH;
            singleBlockX = droppedComponents[0].left + firstBlockWidth / 2;
            singleBlockY = droppedComponents[0].top + firstBlockHeight / 2;
        }
        
        if (dropZoneRefInternal.current) { // Check if dropZoneRefInternal.current is not null
            setPanOffset({
                x: dropZoneRefInternal.current.clientWidth / 2 - singleBlockX * zoomLevel,
                y: dropZoneRefInternal.current.clientHeight / 2 - singleBlockY * zoomLevel
            });
        } else {
             setPanOffset({ x: 0, y: 0 }); // Fallback if dropZoneRefInternal.current is null
        }
        return;
    }

    if (!dropZoneRefInternal.current) return; // Guard against null

    const dzW = dropZoneRefInternal.current.clientWidth - 2 * padding;
    const dzH = dropZoneRefInternal.current.clientHeight - 2 * padding;
    const newZ = Math.min(dzW / contentW, dzH / contentH, 2);
    setPanOffset({
        x: padding - (minX * newZ) + (dzW - contentW * newZ) / 2,
        y: padding - (minY * newZ) + (dzH - contentH * newZ) / 2
    });
    setZoomLevel(newZ);
  };

  const currentConfiguringBlockDetails = configuringBlock && droppedComponents.find(dc => dc.instanceId === configuringBlock.instanceId);

  return (
    <div className="flex-grow flex flex-col relative bg-gray-700 overflow-hidden">
      <DropZoneControlButtons 
        onZoomIn={() => setZoomLevel(z => Math.min(z * 1.2, 5))}
        onZoomOut={() => setZoomLevel(z => Math.max(z / 1.2, 0.2))}
        onAutoFitView={autoFit} 
        canZoomIn={zoomLevel < 5}
        canZoomOut={zoomLevel > 0.2}
      />
      <div 
        ref={dropZoneRefInternal}
        className="flex-grow relative overflow-hidden bg-gray-800 cursor-grab active:cursor-grabbing animated-dots-bg"
        onDragOver={onDragOver} onDrop={onDrop} onWheel={handleWheel} onMouseDown={handleMouseDownOnDropZone}
      >
        <div 
          ref={contentWrapperRef} 
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, transformOrigin: '0 0', width: '10000px', height: '10000px', position: 'absolute' }}
        >
          {droppedComponents.map((comp) => (
            
            <div
              key={comp.instanceId}
              style={{
                position: 'absolute',
                left: `${comp.left}px`,
                top: `${comp.top}px`,
                cursor: draggingBlockInstanceId === comp.instanceId ? 'grabbing' : 'grab',
                zIndex: draggingBlockInstanceId === comp.instanceId ? 1000 : 1,
              }}
              onMouseDown={(e) => handleMouseDownOnBlock(e, comp.instanceId)}
              onClick={(e) => e.stopPropagation()} 
            >
              <GenericBlock
                key={`gb-${comp.instanceId}`}
                blockId={comp.id}
                instanceId={comp.instanceId}
                name={
                  categorizedComponents
                    .flatMap(cat => cat.items)
                    .find(item => item.id === comp.id)?.name
                  || comp.name
                }
                config={comp.config as BlockConfig | undefined} 
                executionIn={comp.ports.executionIn}
                executionOuts={comp.ports.executionOuts}
                dataIns={comp.ports.dataIns}
                dataOuts={comp.ports.dataOuts}
                onOpenConfiguration={handleOpenConfiguration} 
                onPortClick={handlePortClick} 
              />
            </div>
          ))}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {connections.map(conn => {
              const fromCenter = getPortCenter(conn.fromBlockInstanceId, conn.fromPortId);
              const toCenter = getPortCenter(conn.toBlockInstanceId, conn.toPortId);
              if (!fromCenter || !toCenter) return null;

              const fromBlock = droppedComponents.find(b => b.instanceId === conn.fromBlockInstanceId);
              let wireColor = getWireColor('execution');
              if (fromBlock && conn.type === 'data') {
                const fromPort = 
                  fromBlock.ports.dataOuts?.find(p => p.id === conn.fromPortId) || 
                  fromBlock.ports.dataIns?.find(p => p.id === conn.fromPortId);
                if (fromPort) wireColor = getWireColor(fromPort.dataType);
              } else if (conn.type === 'execution') {
                wireColor = getWireColor('execution');
              }
              
              return (
                <line
                  key={conn.id}
                  x1={fromCenter.x}
                  y1={fromCenter.y}
                  x2={toCenter.x}
                  y2={toCenter.y}
                  stroke={wireColor}
                  strokeWidth="2"
                  onClick={(e) => { e.stopPropagation(); /* handleDeleteConnection(conn.id); */ }}
                  className="cursor-pointer hover:stroke-red-500"
                />
              );
            })}
            {tempWirePosition && connectingPort && (
              <line
                x1={tempWirePosition.x1}
                y1={tempWirePosition.y1}
                x2={tempWirePosition.x2}
                y2={tempWirePosition.y2}
                stroke={getWireColor(connectingPort.port.dataType)}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>
        </div>
      </div>
      <TrashCan 
        isVisible={!!draggingBlockInstanceId || !!connectingPort} 
        onDeleteBlock={handleDeleteBlock} 
        draggingBlockInstanceId={draggingBlockInstanceId} 
      />
      {configuringBlock && currentConfiguringBlockDetails && (
        <BlockConfigurationModal 
          isOpen={!!configuringBlock} 
          onClose={handleCloseConfiguration} 
          blockName={currentConfiguringBlockDetails.name}
          documentation={currentConfiguringBlockDetails.documentation || "Aucune documentation pour ce bloc."} 
        >
          {getBlockConfigurationUI(
            currentConfiguringBlockDetails.instanceId, 
            currentConfiguringBlockDetails.id, 
            currentConfiguringBlockDetails.config, 
            sidebarComponents 
          )}
        </BlockConfigurationModal>
      )}
    </div>
  );
});

DropZone.displayName = 'DropZone';

export default DropZone;
