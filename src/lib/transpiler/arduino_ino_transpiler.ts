// --- Project Structure Validation ---
/**
 * Vérifie la structure du projet Jino :
 * - Pas de boucle infinie entre deux blocs (cycle dans le graphe d'exécution)
 * - Tous les blocs d'exécution ont une fin (Fin Setup ou Fin Loop)
 * Retourne un tableau d'erreurs (vide si tout est OK)
 */
export function validateProjectStructure(project: JinoProject): string[] {
  const errors: string[] = [];

  // 1. Vérification des cycles (boucles infinies)
  // On ne vérifie que les connexions d'exécution (ports kind === 'execution')
  const execConnections = project.connections.filter(
    c => {
      const fromBlock = project.droppedComponents.find(b => b.instanceId === c.fromBlockInstanceId);
      const toBlock = project.droppedComponents.find(b => b.instanceId === c.toBlockInstanceId);
      // On ne garde que les connexions entre ports d'exécution
      return fromBlock && toBlock &&
        Array.isArray(fromBlock.ports) && fromBlock.ports.some(p => p.id === c.fromPortId && p.kind === 'execution') &&
        Array.isArray(toBlock.ports) && toBlock.ports.some(p => p.id === c.toPortId && p.kind === 'execution');
    }
  );

  // Construction du graphe d'exécution
  const execGraph: Record<string, string[]> = {};
  execConnections.forEach(c => {
    if (!execGraph[c.fromBlockInstanceId]) execGraph[c.fromBlockInstanceId] = [];
    execGraph[c.fromBlockInstanceId].push(c.toBlockInstanceId);
  });

  // Détection de cycles par DFS
  function hasCycle(startId: string, visited: Set<string>, stack: Set<string>): boolean {
    if (!visited.has(startId)) {
      visited.add(startId);
      stack.add(startId);
      const neighbors = execGraph[startId] || [];
      for (const n of neighbors) {
        if (!visited.has(n) && hasCycle(n, visited, stack)) return true;
        else if (stack.has(n)) return true;
      }
    }
    stack.delete(startId);
    return false;
  }
  for (const node of Object.keys(execGraph)) {
    if (hasCycle(node, new Set(), new Set())) {
      errors.push("Boucle d'exécution détectée entre des blocs. Corrigez les connexions pour éviter des boucles infinies.");
      break;
    }
  }

  // 2. Vérification que chaque séquence a une fin (Fin Setup ou Fin Loop)
  // On cherche tous les blocs de début (setup/loop) et on vérifie que chaque chemin mène à une fin
  const startBlocks = project.droppedComponents.filter(b => b.id === 'program_setup_start' || b.id === 'program_loop_start');
  const endBlockIds = ['program_setup_end', 'program_loop_end'];

  function pathLeadsToEnd(blockId: string, visited: Set<string>): boolean {
    if (visited.has(blockId)) return false; // boucle
    visited.add(blockId);
    const block = project.droppedComponents.find(b => b.instanceId === blockId);
    if (!block) return false;
    if (endBlockIds.includes(block.id)) return true;
    // Trouver les sorties d'exécution
    const execOutPorts = Array.isArray(block.ports) ? block.ports.filter(p => p.kind === 'execution' && p.flow === 'out') : [];
    if (execOutPorts.length === 0) return false;
    for (const port of execOutPorts) {
      const next = project.connections.find(c => c.fromBlockInstanceId === blockId && c.fromPortId === port.id);
      if (next) {
        if (pathLeadsToEnd(next.toBlockInstanceId, new Set(visited))) return true;
      }
    }
    return false;
  }
  for (const start of startBlocks) {
    if (!pathLeadsToEnd(start.instanceId, new Set())) {
      errors.push(`Le chemin depuis le bloc de début (${start.name || start.id}) n'atteint pas de bloc de fin (Fin Setup ou Fin Loop).`);
    }
  }

  return errors;
}
import { JinoProject, DroppedComponent/*, Connection*/ } from '@/types/project'; // Adjusted imports
import { VariableNameConfigData } from '@/components/build/configs/VariableNameConfig'; // For variable types

export interface TranspilationOptions {
  style: 'natural' | 'compressed';
}

// --- Helper Functions ---

function findBlockById(project: JinoProject, id: string): DroppedComponent | undefined {
  return project.droppedComponents.find(c => c.instanceId === id); // Changed c.id to c.instanceId
}

function findConnectedBlockAndPort(
  project: JinoProject,
  targetBlockInstanceId: string, // Changed to instanceId
  targetPortId: string, // data input port
): { block: DroppedComponent; portId: string } | undefined {
  const connection = project.connections.find(
    conn => conn.toBlockInstanceId === targetBlockInstanceId && conn.toPortId === targetPortId // Used conn.to
  );
  if (connection) {
    const sourceBlock = findBlockById(project, connection.fromBlockInstanceId); // Used conn.from
    if (sourceBlock) {
      return { block: sourceBlock, portId: connection.fromPortId }; // Used conn.from
    }
  }
  return undefined;
}

function findNextExecutionBlock(
  project: JinoProject,
  currentBlockInstanceId: string, // Changed to instanceId
  executionPortId: string
): DroppedComponent | undefined {
  const connection = project.connections.find(
    conn => conn.fromBlockInstanceId === currentBlockInstanceId && conn.fromPortId === executionPortId // Used conn.from
  );
  if (connection) {
    return findBlockById(project, connection.toBlockInstanceId); // Used conn.to
  }
  return undefined;
}


// Generates the C++ code for a value connected to a data input port
function getInputValueCode(
  project: JinoProject,
  consumingBlockInstanceId: string, 
  dataInputPortId: string,
  options: TranspilationOptions,
): string {
  const source = findConnectedBlockAndPort(project, consumingBlockInstanceId, dataInputPortId);
  if (!source) {
    const consumingBlock = findBlockById(project, consumingBlockInstanceId);
    if (
      consumingBlock?.config &&
      Object.prototype.hasOwnProperty.call(consumingBlock.config, dataInputPortId)
    ) {
        const configVal = (consumingBlock.config as Record<string, unknown>)[dataInputPortId];
        if (typeof configVal === 'number') return String(configVal);
        if (typeof configVal === 'string') return `String(${JSON.stringify(configVal)})`;
        if (typeof configVal === 'boolean') return configVal ? 'true' : 'false';
    }
    return `/* ${dataInputPortId}_unconnected_on_${consumingBlock?.name} */`;
  }

  const { block: sourceBlock, portId: sourcePortId } = source;

  switch (sourceBlock.id) { // Changed from sourceBlock.componentId to sourceBlock.id
    case 'variable_get':
      return (sourceBlock.config as VariableNameConfigData)?.name || `/* unconfigured_variable_get */`; // Added type assertion
    case 'constant_number':
      return String((sourceBlock.config as Record<string, unknown>)?.value ?? 0);
    case 'constant_string':
      const strVal = String((sourceBlock.config as Record<string, unknown>)?.value ?? ""); // Specify type instead of 'any'
      return `String(${JSON.stringify(strVal)})`;
    case 'constant_boolean':
      return (sourceBlock.config as Record<string, unknown>)?.value ? 'true' : 'false';
    case 'math_operation':
      const opA = getInputValueCode(project, sourceBlock.instanceId, 'operand_a', options);
      const opB = getInputValueCode(project, sourceBlock.instanceId, 'operand_b', options);
      const mathOperator = (sourceBlock.config as { operator?: string })?.operator || '+'; // Specify type for config
      let cppMathOperator = '+';
      switch(mathOperator) {
        case 'ADD': cppMathOperator = '+'; break;
        case 'SUBTRACT': cppMathOperator = '-'; break;
        case 'MULTIPLY': cppMathOperator = '*'; break;
        case 'DIVIDE': cppMathOperator = '/'; break;
      }
      return `(${opA} ${cppMathOperator} ${opB})`;
    case 'logic_operation': {
      const logicOperator = (sourceBlock.config as { operator?: string })?.operator || 'AND';
      // Collect all operand_N ports (operand_1, operand_2, ...)
      let operandPortIds: string[] = [];
      if (Array.isArray(sourceBlock.ports)) {
        operandPortIds = (sourceBlock.ports as { id: string; kind: string; flow: string }[])
          .filter(p => p.kind === 'data' && p.flow === 'in' && /^operand_\d+$/.test(p.id))
          .map(p => p.id);
      } else if (typeof sourceBlock.ports === 'object' && sourceBlock.ports !== null && 'dataIns' in sourceBlock.ports) {
        const dataIns = (sourceBlock.ports as { dataIns?: { id: string; kind: string; flow: string }[] }).dataIns;
        if (Array.isArray(dataIns)) {
          operandPortIds = dataIns.filter(p => p.kind === 'data' && p.flow === 'in' && /^operand_\d+$/.test(p.id)).map(p => p.id);
        }
      }
      // Sort operand_N numerically
      operandPortIds.sort((a, b) => {
        const na = parseInt(a.replace('operand_', ''));
        const nb = parseInt(b.replace('operand_', ''));
        return na - nb;
      });
      if (logicOperator === 'NOT') {
        // For NOT, use only operand_1
        const notOp = getInputValueCode(project, sourceBlock.instanceId, operandPortIds[0] || 'operand_1', options);
        return `(!${notOp})`;
      } else {
        // For AND, OR, XOR, join all operands
        let cppLogicOperator = '&&';
        switch (logicOperator) {
          case 'AND': cppLogicOperator = '&&'; break;
          case 'OR': cppLogicOperator = '||'; break;
          case 'XOR': cppLogicOperator = '^'; break;
        }
        const operandCodes = operandPortIds.map(portId => getInputValueCode(project, sourceBlock.instanceId, portId, options));
        if (operandCodes.length === 0) return 'false';
        // For XOR, chain with ^, for AND/OR chain with &&/||
        return `(${operandCodes.join(' ' + cppLogicOperator + ' ')})`;
      }
    }
    case 'button_read':
    case 'sensor_digital_read':
      const digitalPin = getInputValueCode(project, sourceBlock.instanceId, 'pin', options);
      return `digitalRead(${digitalPin})`;
    case 'sensor_read':
      const analogPin = getInputValueCode(project, sourceBlock.instanceId, 'pin', options);
      return `analogRead(${analogPin})`;
    case 'get_time':
      return `millis()`;
    default:
      return `/* val_from_${sourceBlock.id}.${sourcePortId} */`; // Changed from sourceBlock.componentId to sourceBlock.id
  }
}

function collectPinModes(project: JinoProject, options: TranspilationOptions): Map<string, string> {
  const pinModes = new Map<string, string>();
  project.droppedComponents.forEach(block => {
    let pinValue: string | undefined;
    let mode: string | undefined;
    const getStaticPin = (blockInstanceId: string, pinPortId: string): string | undefined => {
      const source = findConnectedBlockAndPort(project, blockInstanceId, pinPortId);
      if (source && source.block.id === 'constant_number' && (source.block.config as Record<string, unknown>)?.value !== undefined) { // Changed to id and 'as Record<string, unknown>'
        return String((source.block.config as Record<string, unknown>).value); // Changed to 'as Record<string, unknown>'
      }
      const currentBlock = findBlockById(project, blockInstanceId);
      if ((currentBlock?.config as Record<string, unknown>)?.pin !== undefined) { // Changed to 'as Record<string, unknown>'
         return String((currentBlock!.config as Record<string, unknown>).pin); // Changed to 'as Record<string, unknown>', added non-null assertion for currentBlock
      }
      return undefined;
    };

    switch (block.id) { // Changed from block.componentId to block.id
      case 'led_on':
      case 'led_off':
      case 'set_pin_state':
      case 'buzzer_play':
        pinValue = getStaticPin(block.instanceId, 'pin');
        mode = 'OUTPUT';
        break;
      case 'button_read':
      case 'sensor_digital_read':
        pinValue = getStaticPin(block.instanceId, 'pin');
        mode = 'INPUT';
        break;
    }
    if (pinValue && mode) {
      if (!pinModes.has(pinValue) || pinModes.get(pinValue) !== mode) {
        if (pinModes.get(pinValue) === 'OUTPUT' && mode === 'INPUT') {
        } else {
            pinModes.set(pinValue, mode);
        }
      }
    } else if (mode && options.style === 'natural') {
    }
  });
  return pinModes;
}


function transpileExecutionSequence(
  project: JinoProject,
  startBlock: DroppedComponent | undefined,
  options: TranspilationOptions,
  indentation: string,
): string {
  let sequenceCode = '';
  let currentBlock = startBlock;
  const visitedBlocks = new Set<string>();

  while (currentBlock) {
    if (options.style === 'natural') {
      sequenceCode += `${indentation}// Block: ${currentBlock.name} (ID: ${currentBlock.instanceId}, Type: ${currentBlock.id})\n`;
    }
    let blockSpecificCodeGenerated = false;
    switch (currentBlock.id) {
      case 'program_setup_end':
      case 'program_loop_end':
      case 'function_definition_end':
        if (options.style === 'natural') sequenceCode += `${indentation}// End of sequence marker: ${currentBlock.id}\n`;
        currentBlock = undefined;
        blockSpecificCodeGenerated = true;
        break;
      case 'led_on':
        sequenceCode += `${indentation}digitalWrite(${getInputValueCode(project, currentBlock.instanceId, 'pin', options)}, HIGH);\n`;
        break;
      case 'led_off':
        sequenceCode += `${indentation}digitalWrite(${getInputValueCode(project, currentBlock.instanceId, 'pin', options)}, LOW);\n`;
        break;
      case 'set_pin_state':
        sequenceCode += `${indentation}digitalWrite(${getInputValueCode(project, currentBlock.instanceId, 'pin', options)}, ${getInputValueCode(project, currentBlock.instanceId, 'state', options)} ? HIGH : LOW);\n`;
        break;
      case 'analog_write':
        sequenceCode += `${indentation}analogWrite(${getInputValueCode(project, currentBlock.instanceId, 'pin', options)}, ${getInputValueCode(project, currentBlock.instanceId, 'value', options)});\n`;
        break;
      case 'delay':
        sequenceCode += `${indentation}delay(${getInputValueCode(project, currentBlock.instanceId, 'duration', options)});\n`;
        break;
      case 'millis_delay':
        // Temporisation non bloquante
        sequenceCode += `${indentation}static unsigned long __lastMillis_${currentBlock.instanceId} = 0;\n`;
        sequenceCode += `${indentation}if (millis() - __lastMillis_${currentBlock.instanceId} >= ${getInputValueCode(project, currentBlock.instanceId, 'duration', options)}) {\n`;
        sequenceCode += `${indentation}  __lastMillis_${currentBlock.instanceId} = millis();\n`;
        break;
      case 'serial_print':
        sequenceCode += `${indentation}Serial.print(${getInputValueCode(project, currentBlock.instanceId, 'value', options)});\n`;
        break;
      case 'serial_println':
        sequenceCode += `${indentation}Serial.println(${getInputValueCode(project, currentBlock.instanceId, 'value', options)});\n`;
        break;
      case 'variable_set': {
        const varToSet = findBlockById(project, currentBlock.instanceId)?.config as VariableNameConfigData | undefined;
        if (varToSet?.name) {
          const valueToSet = getInputValueCode(project, currentBlock.instanceId, 'value_in', options);
          sequenceCode += `${indentation}${varToSet.name} = ${valueToSet};\n`;
        } else {
          if (options.style === 'natural') sequenceCode += `${indentation}// Unconfigured variable_set block\n`;
        }
        break;
      }
      case 'variable_toggle': {
        const varToToggle = findBlockById(project, currentBlock.instanceId)?.config as VariableNameConfigData | undefined;
        if (varToToggle?.name) {
          sequenceCode += `${indentation}${varToToggle.name} = !${varToToggle.name};\n`;
        } else {
          if (options.style === 'natural') sequenceCode += `${indentation}// Unconfigured variable_toggle block\n`;
        }
        break;
      }
      case 'variable_increment': {
        const varToInc = findBlockById(project, currentBlock.instanceId)?.config as VariableNameConfigData | undefined;
        if (varToInc?.name) {
          sequenceCode += `${indentation}${varToInc.name}++;\n`;
        } else {
          if (options.style === 'natural') sequenceCode += `${indentation}// Unconfigured variable_increment block\n`;
        }
        break;
      }
      case 'variable_decrement': {
        const varToDec = findBlockById(project, currentBlock.instanceId)?.config as VariableNameConfigData | undefined;
        if (varToDec?.name) {
          sequenceCode += `${indentation}${varToDec.name}--;\n`;
        } else {
          if (options.style === 'natural') sequenceCode += `${indentation}// Unconfigured variable_decrement block\n`;
        }
        break;
      }
      case 'user_comment': {
        const comment = (findBlockById(project, currentBlock.instanceId)?.config as { comment?: string })?.comment || '';
        sequenceCode += `${indentation}// ${comment}\n`;
        break;
      }
      case 'if': {
        const conditionIf = getInputValueCode(project, currentBlock.instanceId, 'condition', options);
        sequenceCode += `${indentation}if (${conditionIf}) {\n`;
        const thenStartBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_then');
        sequenceCode += transpileExecutionSequence(project, thenStartBlock, options, indentation + '  ');
        sequenceCode += `${indentation}}\n`;
        const elseStartBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_else');
        if (elseStartBlock) {
          sequenceCode += `${indentation}else {\n`;
          sequenceCode += transpileExecutionSequence(project, elseStartBlock, options, indentation + '  ');
          sequenceCode += `${indentation}}\n`;
        }
        currentBlock = undefined;
        blockSpecificCodeGenerated = true;
        break;
      }
      case 'while': {
        const conditionWhile = getInputValueCode(project, currentBlock.instanceId, 'condition', options);
        sequenceCode += `${indentation}while (${conditionWhile}) {\n`;
        const loopBodyStartBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_loop');
        sequenceCode += transpileExecutionSequence(project, loopBodyStartBlock, options, indentation + '  ');
        sequenceCode += `${indentation}}\n`;
        currentBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_end');
        blockSpecificCodeGenerated = true;
        break;
      }
      case 'for_loop': {
        // Suppose config: { varName: string, from: number, to: number, step: number }
        const config = findBlockById(project, currentBlock.instanceId)?.config as { varName?: string, from?: number, to?: number, step?: number };
        if (config?.varName) {
          const from = config.from ?? 0;
          const to = config.to ?? 10;
          const step = config.step ?? 1;
          sequenceCode += `${indentation}for(int ${config.varName} = ${from}; ${config.varName} < ${to}; ${config.varName} += ${step}) {\n`;
          const bodyStartBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_body');
          sequenceCode += transpileExecutionSequence(project, bodyStartBlock, options, indentation + '  ');
          sequenceCode += `${indentation}}\n`;
        } else {
          sequenceCode += `${indentation}// Unconfigured for_loop block\n`;
        }
        currentBlock = findNextExecutionBlock(project, currentBlock.instanceId, 'exec_out_end');
        blockSpecificCodeGenerated = true;
        break;
      }
      case 'function_call': {
        // Suppose config: { functionName: string, args: string[] }
        const config = findBlockById(project, currentBlock.instanceId)?.config as { functionName?: string, args?: string[] };
        if (config?.functionName) {
          const args = (config.args || []).join(', ');
          sequenceCode += `${indentation}${config.functionName}(${args});\n`;
        } else {
          sequenceCode += `${indentation}// Unconfigured function_call block\n`;
        }
        break;
      }
      case 'return': {
        // Suppose config: { value: string }
        const config = findBlockById(project, currentBlock.instanceId)?.config as { value?: string };
        if (config?.value) {
          sequenceCode += `${indentation}return ${config.value};\n`;
        } else {
          sequenceCode += `${indentation}return;\n`;
        }
        break;
      }
      default:
        if (options.style === 'natural') {
          sequenceCode += `${indentation}// TODO: Transpile block type: ${currentBlock.id}\n`;
        }
        break;
    }

    if (blockSpecificCodeGenerated) {
        if (currentBlock) continue;
        else break;
    }

    // --- Parcours toutes les sorties d'exécution (branches multiples) ---
    type Port = { id: string; kind: string; flow: string };
    let execOutPorts: Port[] = [];
    if (currentBlock) {
      if (Array.isArray(currentBlock.ports)) {
        execOutPorts = (currentBlock.ports as Port[]).filter((p: Port) => p.kind === 'execution' && p.flow === 'out');
      } else if (typeof currentBlock.ports === 'object' && currentBlock.ports !== null) {
        const portsObj = currentBlock.ports as {
          executionOuts?: Port[];
          executionOut?: Port;
        };
        if (Array.isArray(portsObj.executionOuts)) {
          execOutPorts = portsObj.executionOuts.filter((p: Port) => p.kind === 'execution' && p.flow === 'out');
        } else if (
          portsObj.executionOut &&
          typeof portsObj.executionOut === 'object' &&
          portsObj.executionOut.kind === 'execution' &&
          portsObj.executionOut.flow === 'out'
        ) {
          execOutPorts = [portsObj.executionOut];
        }
      }
    }
    if (currentBlock && execOutPorts.length > 1) {
      for (const port of execOutPorts) {
        const nextBlock = findNextExecutionBlock(project, currentBlock.instanceId, port.id);
        if (nextBlock && !visitedBlocks.has(nextBlock.instanceId)) {
          sequenceCode += transpileExecutionSequence(project, nextBlock, options, indentation);
        }
      }
      currentBlock = undefined;
    } else if (currentBlock && execOutPorts.length === 1) {
      const nextBlock = findNextExecutionBlock(project, currentBlock.instanceId, execOutPorts[0].id);
      if (nextBlock && !visitedBlocks.has(nextBlock.instanceId)) {
        visitedBlocks.add(nextBlock.instanceId);
        currentBlock = nextBlock;
      } else {
        currentBlock = undefined;
      }
    } else {
      currentBlock = undefined;
    }
  }
  return sequenceCode;
}

// --- Main Transpilation Function ---
export function transpileToArduinoIno(
  project: JinoProject,
  options: TranspilationOptions
): string {
  let inoCode = '';
  console.log(project)

  // Header
  if (options.style === 'natural') {
    inoCode += `// Project: ${project.projectName || 'Mon Projet Jino'}\n`;
    inoCode += `// Exported on: ${new Date().toISOString()}\n`;
    inoCode += `// Jino Version: ${project.jinoVersion}\n`;
    inoCode += `// Transpiler: arduino_ino_transpiler.ts\n`;
    inoCode += `// Style: ${options.style}\n`;
    inoCode += '\n';
  }

  // 1. Global Variable Declarations
  if (options.style === 'natural' && project.definedVariables && project.definedVariables.length > 0) {
    inoCode += '// Global Variables\n';
  }
  project.definedVariables?.forEach(variable => {
    let type = 'void'; // Default, should be overridden
    switch (variable.dataType) {
      case 'Nombre': type = 'float'; break;
      case 'Texte': type = 'String'; break;
      case 'Booléen': type = 'boolean'; break;
      case 'Tableau': // Array declaration in C++ needs type and often size.
                      // Jino\'s \'Tableau\' is generic. This needs more info.
                      // Example: float myArray[10]; or String myStrings[];
        type = `/* TODO: Array type for ${variable.name} (e.g., float[], String[]) */ auto`; // auto might not work globally
        if (options.style === 'natural') {
            inoCode += `// TODO: Define array type and potentially size for ${variable.name} of type ${variable.arrayElementType || 'unknown'}\n`; // Used arrayElementType
        }
        // For now, skip adding incomplete array declarations globally, needs better handling
        inoCode += `// Global array ${variable.name} of ${variable.arrayElementType || 'unknown'} needs proper declaration (e.g., with size or as a class wrapper)\n`;
        return; // Skip adding incomplete declaration for now
      default: type = 'void';
    }
    inoCode += `${type} ${variable.name};\n`;
  });
  if (project.definedVariables && project.definedVariables.length > 0) {
    inoCode += '\n';
  }

  // 2. Function Definitions (User-defined functions from Jino)
  // TODO: Implement transpilation of Jino function definitions
  // This would involve finding 'function_definition_start' blocks,
  // generating C++ function signatures based on their config (name, params, return type),
  // and then transpiling their execution sequence.
  if (options.style === 'natural') {
    inoCode += '// User-Defined Function Definitions (if any)\n';
    inoCode += '// TODO: Implement Jino function transpilation\n';
    inoCode += '\n';
  }
  
  const collectedPinModes = collectPinModes(project, options);
  let setupPinModeCode = '';
  if (collectedPinModes.size > 0) {
    if (options.style === 'natural') {
      setupPinModeCode += '  // Pin initializations\n';
    }
    collectedPinModes.forEach((mode, pin) => {
      setupPinModeCode += `  pinMode(${pin}, ${mode.toUpperCase()});\n`;
    });
    if (options.style === 'natural') {
      setupPinModeCode += '\n';
    }
  }

  const setupStartBlock = project.droppedComponents.find(c => c.id === 'program_setup_start');
  let setupExecutionCode = '';
  if (setupStartBlock) {
    let execOutPorts: { id: string; kind: string; flow: string }[] = [];
    if (Array.isArray(setupStartBlock.ports)) {
      execOutPorts = (setupStartBlock.ports as { id: string; kind: string; flow: string }[]).filter((p) => p.kind === 'execution' && p.flow === 'out');
    } else if (typeof setupStartBlock.ports === 'object' && setupStartBlock.ports !== null) {
      const portsObj = setupStartBlock.ports as {
        executionOuts?: { id: string; kind: string; flow: string }[];
        executionOut?: { id: string; kind: string; flow: string };
      };
      if (Array.isArray(portsObj.executionOuts)) {
        execOutPorts = portsObj.executionOuts.filter((p) => p.kind === 'execution' && p.flow === 'out');
      } else if (
        portsObj.executionOut &&
        typeof portsObj.executionOut === 'object' &&
        portsObj.executionOut.kind === 'execution' &&
        portsObj.executionOut.flow === 'out'
      ) {
        execOutPorts = [portsObj.executionOut];
      }
    }
    for (const port of execOutPorts) {
      const nextBlock = findNextExecutionBlock(project, setupStartBlock.instanceId, port.id);
      if (nextBlock) {
        setupExecutionCode += transpileExecutionSequence(project, nextBlock, options, '  ');
      }
    }
  }
  // ... setup() function ...
  if (options.style === 'natural') {
    inoCode += 'void setup() {\n';
    inoCode += setupPinModeCode; 
    if (setupExecutionCode.trim().length > 0) {
        inoCode += setupExecutionCode;
    } else {
        inoCode += '  // No blocks in setup sequence.\n';
    }
    inoCode += '}\n\n';
  } else {
    inoCode += 'void setup(){';
    inoCode += setupPinModeCode.replace(/^\s+/gm, ''); 
    inoCode += setupExecutionCode.replace(/^\s+/gm, '');
    inoCode += '}\n';
  }

  const loopStartBlock = project.droppedComponents.find(c => c.id === 'program_loop_start');
  let loopExecutionCode = '';
  if (loopStartBlock) {
    let execOutPorts: { id: string; kind: string; flow: string }[] = [];
    if (Array.isArray(loopStartBlock.ports)) {
      execOutPorts = (loopStartBlock.ports as { id: string; kind: string; flow: string }[]).filter((p) => p.kind === 'execution' && p.flow === 'out');
    } else if (typeof loopStartBlock.ports === 'object' && loopStartBlock.ports !== null) {
      const portsObj = loopStartBlock.ports as {
        executionOuts?: { id: string; kind: string; flow: string }[];
        executionOut?: { id: string; kind: string; flow: string };
      };
      if (Array.isArray(portsObj.executionOuts)) {
        execOutPorts = portsObj.executionOuts.filter((p) => p.kind === 'execution' && p.flow === 'out');
      } else if (
        portsObj.executionOut &&
        typeof portsObj.executionOut === 'object' &&
        portsObj.executionOut.kind === 'execution' &&
        portsObj.executionOut.flow === 'out'
      ) {
        execOutPorts = [portsObj.executionOut];
      }
    }
    for (const port of execOutPorts) {
      const nextBlock = findNextExecutionBlock(project, loopStartBlock.instanceId, port.id);
      if (nextBlock) {
        loopExecutionCode += transpileExecutionSequence(project, nextBlock, options, '  ');
      }
    }
  }
  // ... loop() function ...
  if (options.style === 'natural') {
    inoCode += 'void loop() {\n';
    if (loopExecutionCode.trim().length > 0) {
        inoCode += loopExecutionCode;
    } else {
        inoCode += '  // No blocks in loop sequence.\n';
    }
    inoCode += '}\n';
  } else {
    inoCode += 'void loop(){';
    inoCode += loopExecutionCode.replace(/^\s+/gm, '');
    inoCode += '}\n';
  }
  // ... Final compression ...
  if (options.style === 'compressed') {
    inoCode = inoCode.replace(/\/\/.*?\n/g, '\n'); 
    inoCode = inoCode.replace(/\/\*[\s\S]*?\*\//g, ''); 
    inoCode = inoCode.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
    inoCode = inoCode.replace(/\s*{\s*/g, '{');
    inoCode = inoCode.replace(/\s*}\s*/g, '}');
    inoCode = inoCode.replace(/;\s*/g, ';');
    inoCode = inoCode.replace(/\s*\)\s*/g, ')');
    inoCode = inoCode.replace(/\s*\(\s*/g, '(');
    inoCode = inoCode.replace(/\s*,\s*/g, ',');
  }
  console.log("Transpiled .ino code (intermediate):\n", inoCode);
  return inoCode;
}
