"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { JINO_APP_VERSION, JinoProject } from "@/types/project";
import UploadStatusModal, {
  UploadStep,
} from "@/components/modals/UploadStatusModal";
import ArduinoUploaderV2 from "./ArduinoUploaderV2";

// Minimal SerialOptions type for compatibility with Web Serial API
type SerialOptions = {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
};

// Minimal interface for SerialPort to satisfy TypeScript if not globally available
export interface MinimalSerialPort {
  getInfo(): { usbVendorId?: number; usbProductId?: number };
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  setSignals?(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>; // MODIFIED: Added setSignals
  // Add locked property for diagnostic checks, assuming it might exist
  readonly readableStream?: { locked?: boolean };
  readonly writableStream?: { locked?: boolean };
}

interface ArduinoUploaderProps {
  getProjectDataForSave: () => Omit<
    JinoProject,
    "jinoVersion" | "lastSaved" | "projectName"
  >;
  currentProjectName: string | null;
  triggerUpload: boolean;
  onUploadFinished: () => void;
}

interface ArduinoBoard {
  value: string;
  label: string;
  // Future properties: baudRate, bootloaderProtocol, etc.
}

const AVAILABLE_BOARDS: ArduinoBoard[] = [
  { value: "uno", label: "Arduino Uno" },
  { value: "nano", label: "Arduino Nano" },
  { value: "mega", label: "Arduino Mega 2560" },
  // Add other boards as needed
];

const AUTOMATED_UPLOAD_STEPS: UploadStep[] = [
  // Steps after port is open and ready
  { label: "Génération du code Arduino (.ino)", status: "pending" },
  { label: "Compilation du code via API distante", status: "pending" },
  { label: "Synchronisation avec le bootloader", status: "pending" },
  { label: "Entrée en mode programmation", status: "pending" },
  { label: "Téléversement des pages (HEX)", status: "pending" },
  { label: "Sortie du mode programmation", status: "pending" },
  { label: "Finalisation", status: "pending" },
];

// const STK_OK = 0x10;
// const STK_INSYNC = 0x14;
// const PROG_PAGE_SIZE = 128; // Common for Uno, check for Mega etc.

// const SYNC_COMMANDS: Record<
//   string,
//   { command: Uint8Array; expected: Uint8Array; timeout: number }
// > = {
//   uno: {
//     command: new Uint8Array([0x30, 0x20]),
//     expected: new Uint8Array([STK_INSYNC, STK_OK]),
//     timeout: 300,
//   },
//   nano: {
//     command: new Uint8Array([0x30, 0x20]),
//     expected: new Uint8Array([STK_INSYNC, STK_OK]),
//     timeout: 500,
//   },
//   mega: {
//     command: new Uint8Array([0x30, 0x20]),
//     expected: new Uint8Array([STK_INSYNC, STK_OK]),
//     timeout: 1000, // Increased timeout for Mega 2560
//   },
// };

const ArduinoUploader: React.FC<ArduinoUploaderProps> = ({
  getProjectDataForSave,
  currentProjectName,
  triggerUpload,
  onUploadFinished,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // State to trigger the actual upload with Avrgirl
  const [pendingUpload, setPendingUpload] = useState<{
    board: string;
    port: string;
    hexFile: Buffer;
  } | null>(null);
  // Callback pour suivre le statut du téléversement via ArduinoUploaderV2
  const handleUploaderV2Status = (status: string) => {
    if (status.startsWith('Téléversement réussi')) {
      updateStepStatus(5, "completed", "Sortie du mode programmation et reset OK");
      updateStepStatus(6, "completed", "Téléversement terminé avec succès !");
      setCurrentPhase("finished");
      setPendingUpload(null);
    } else if (status.startsWith('Échec') || status.startsWith('Erreur')) {
      updateStepStatus(currentUploadStepIndex, "error", status);
      setUploadOverallError(status);
      setCurrentPhase("finished");
      setPendingUpload(null);
    } else {
      updateStepStatus(currentUploadStepIndex, "in-progress", status);
    }
  };
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([
    ...AUTOMATED_UPLOAD_STEPS,
  ]);
  const [currentUploadStepIndex, setCurrentUploadStepIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadOverallError, setUploadOverallError] = useState<string | null>(
    null
  );

  const [currentPhase, setCurrentPhase] = useState<
    "initial_config" | "uploading" | "finished"
  >("initial_config");
  const [selectedBoard, setSelectedBoard] = useState<ArduinoBoard | null>(null);
  const [activePort, setActivePort] = useState<MinimalSerialPort | null>(null);
  const [isPortSelected, setIsPortSelected] = useState(false);
  const [isConnectingPort, setIsConnectingPort] = useState(false);

  // Ref to hold the activePort for cleanup in stable callbacks
  const portRef = useRef<MinimalSerialPort | null>(null);
  useEffect(() => {
    portRef.current = activePort;
  }, [activePort]);

  const resetModalStateForNewSession = useCallback(() => {
    setCurrentPhase("initial_config");
    setUploadSteps([...AUTOMATED_UPLOAD_STEPS]);
    setCurrentUploadStepIndex(0);
    setUploadProgress(0);
    setUploadOverallError(null);

    const portToClose = portRef.current; // Use the ref's current value
    if (portToClose && typeof portToClose.close === "function") {
      console.log(
        "Resetting modal state: Attempting to close port from ref",
        portToClose
      );
      portToClose.close().catch((e) => {
        // It's common for this to throw "InvalidStateError: The port is already closed."
        // if called on a port from requestPort() that was never open()-ed by us.
        // Or if startUploadProcessActual already closed it.
        if (e instanceof DOMException && e.name === "InvalidStateError") {
          console.log(
            `Benign: Tried to close a port that was already closed or in an invalid state for closing: ${e.message}`
          );
        } else {
          console.warn("Error closing port during modal reset:", e);
        }
      });
    }
    setActivePort(null);
    setIsPortSelected(false);
    setIsConnectingPort(false);
    // Optionally reset selectedBoard, or keep it for user convenience
    // setSelectedBoard(null);
  }, []); // Empty dependency array makes this callback stable

  const updateStepStatus = useCallback(
    (index: number, status: UploadStep["status"], details?: string) => {
      setUploadSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        if (newSteps[index]) {
          newSteps[index] = {
            ...newSteps[index],
            status,
            details: details || newSteps[index].details,
          };
        }
        return newSteps;
      });
      if (
        status === "in-progress" ||
        status === "completed" ||
        status === "error"
      ) {
        setCurrentUploadStepIndex(index);
      }
      if (
        status === "error" ||
        (index === AUTOMATED_UPLOAD_STEPS.length - 1 && status === "completed")
      ) {
        setCurrentPhase("finished");
      }
    },
    []
  );

  const handleBoardChange = (boardValue: string) => {
    const board = AVAILABLE_BOARDS.find((b) => b.value === boardValue) || null;
    setSelectedBoard(board);
    // If board changes, user might need to re-select port or we might invalidate current port
    // For now, just update board. Consider port implications later.
  };

  const handleSelectPort = async () => {
    // @ts-expect-error: navigator.serial is experimental
    if (!navigator.serial) {
      setUploadOverallError(
        "L'API Web Serial n'est pas supportée par votre navigateur. Essayez Chrome ou Edge."
      );
      setCurrentPhase("finished"); // Show error and allow closing
      return;
    }
    setIsConnectingPort(true);
    setUploadOverallError(null);
    try {
      // @ts-expect-error: navigator.serial is experimental
      const port = await navigator.serial.requestPort();
      if (port) {
        setActivePort(port);
        setIsPortSelected(true);
        // Do not open the port here, let startUploadProcess handle it
      } else {
        // User cancelled port selection
        setIsPortSelected(false);
      }
    } catch (error) {
      console.error("Erreur sélection port:", error);
      setUploadOverallError(
        `Erreur lors de la sélection du port : ${(error as Error).message}`
      );
      setIsPortSelected(false);
      // setCurrentPhase('finished'); // Optionally move to finished to show error prominently
    } finally {
      setIsConnectingPort(false);
    }
  };

  const startUploadProcessActual = useCallback(
    async (portToUse: MinimalSerialPort, boardToUse: ArduinoBoard) => {
      setCurrentPhase("uploading");
      setUploadSteps([...AUTOMATED_UPLOAD_STEPS]); // Ensure steps are fresh for this phase
      setCurrentUploadStepIndex(0);
      setUploadProgress(0);
      setUploadOverallError(null);

      let stepIndex = 0; // Index for AUTOMATED_UPLOAD_STEPS
      let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      const baudRate = boardToUse.value === "mega" ? 57600 : 115200; // MODIFIED: Try 57600 for Mega bootloader

      // Define readBytes and sendCommand here as they depend on 'reader', 'writer' and uploader's state setters
      // These functions are nested to have access to 'reader', 'writer', 'updateStepStatus', 'setUploadOverallError'
      // and 'currentUploadStepIndex' from the outer scope.

      // async function readBytes(
      //   numBytes: number,
      //   timeoutMs: number = 2000
      // ): Promise<Uint8Array> {
      //   if (!reader) {
      //     const errorMsg = "Lecteur série non disponible (readBytes).";
      //     // updateStepStatus might not be safe if currentUploadStepIndex is out of bounds for AUTOMATED_UPLOAD_STEPS
      //     setUploadOverallError(errorMsg);
      //     throw new Error(errorMsg);
      //   }
      //   const currentActiveReader = reader;

      //   const buffer = new Uint8Array(numBytes);
      //   let bytesRead = 0;
      //   const overallStartTime = Date.now();

      //   while (
      //     bytesRead < numBytes &&
      //     Date.now() - overallStartTime < timeoutMs
      //   ) {
      //     const remainingTimeout = timeoutMs - (Date.now() - overallStartTime);
      //     if (remainingTimeout <= 0) break;

      //     try {
      //       const readPromise = currentActiveReader.read();
      //       const timeoutPromise = new Promise<never>((_, reject) =>
      //         setTimeout(
      //           () =>
      //             reject(
      //               new Error(
      //                 `Timeout interne (${remainingTimeout}ms) en attendant les données du port.`
      //               )
      //             ),
      //           remainingTimeout
      //         )
      //       );
      //       const { value, done } = await Promise.race([
      //         readPromise,
      //         timeoutPromise,
      //       ]);
      //       if (done)
      //         throw new Error(
      //           "Flux du port terminé (signal 'done') avant de lire tous les octets requis."
      //         );
      //       if (value) {
      //         const remainingToFill = numBytes - bytesRead;
      //         const toCopy = Math.min(value.length, remainingToFill);
      //         buffer.set(value.slice(0, toCopy), bytesRead);
      //         bytesRead += toCopy;
      //       }
      //     } catch (readOrTimeoutError) {
      //       // Propagate the error to be handled by the caller (sendCommand or main try-catch)
      //       throw readOrTimeoutError;
      //     }
      //   }
      //   if (bytesRead < numBytes)
      //     throw new Error(
      //       `Timeout global (${timeoutMs}ms) en lisant ${numBytes} octet(s). Reçu ${bytesRead}.`
      //     );
      //   return buffer.slice(0, bytesRead);
      // }

      // async function sendCommand(
      //   command: Uint8Array,
      //   expectedResponse: Uint8Array | null,
      //   readLength: number = 1,
      //   timeout: number = 1000
      // ): Promise<Uint8Array | null> {
      //   if (!writer) {
      //     const errorMsg = "Écrivain série non disponible (sendCommand).";
      //     setUploadOverallError(errorMsg);
      //     throw new Error(errorMsg);
      //   }
      //   await writer.write(command);
      //   if (!expectedResponse) return null;

      //   try {
      //     const response = await readBytes(readLength, timeout);
      //     // Ensure response is long enough before accessing indices
      //     if (response.length < expectedResponse.length) {
      //       throw new Error(
      //         `Réponse trop courte. Attendu ${expectedResponse.length} octets, Reçu ${response.length}.`
      //       );
      //     }
      //     for (let i = 0; i < expectedResponse.length; i++) {
      //       if (response[i] !== expectedResponse[i]) {
      //         throw new Error(
      //           `Réponse inattendue à la commande ${command[0]?.toString(
      //             16
      //           )}. Attendu: ${Array.from(expectedResponse)
      //             .map((b) => b.toString(16))
      //             .join(" ")}, Reçu: ${Array.from(response)
      //             .map((b) => b.toString(16))
      //             .join(" ")}`
      //         );
      //       }
      //     }
      //     return response;
      //   } catch (error) {
      //     // updateStepStatus(currentUploadStepIndex, 'error', (error as Error).message); // Error is updated in main catch
      //     throw error;
      //   }
      // }

      try {
        // Step: Opening serial port
        console.log(`Attempting to open port with baud rate: ${baudRate}`);
        await portToUse.open({ baudRate }); // Use board-specific baudRate
        const portInfo = portToUse.getInfo();
        console.log(
          `Port opened: ${
            portInfo.usbProductId
              ? portInfo.usbVendorId?.toString(16) +
                ":" +
                portInfo.usbProductId?.toString(16)
              : "N/A"
          }`
        );

        // Get writer and reader after port is successfully opened
        writer = portToUse.writable.getWriter();
        reader = portToUse.readable.getReader();

        stepIndex = 0; // Génération du code Arduino (.ino)
        updateStepStatus(stepIndex, "in-progress");
        let transpileToArduinoIno;
        try {
          transpileToArduinoIno = (
            await import("@/lib/transpiler/arduino_ino_transpiler")
          ).transpileToArduinoIno;
        } catch {
          const errorMsg = "Impossible de charger le transpileur Arduino.";
          updateStepStatus(stepIndex, "error", errorMsg);
          setUploadOverallError(errorMsg);
          throw new Error(errorMsg);
        }
        const currentProjectData = getProjectDataForSave();
        const project: JinoProject = {
          jinoVersion: JINO_APP_VERSION,
          projectName: currentProjectName || "MonProjetJinoUpload",
          lastSaved: new Date().toISOString(),
          ...currentProjectData,
        };
        const inoCode = transpileToArduinoIno(project, { style: "natural" }); // Board info could be passed here
        updateStepStatus(stepIndex, "completed");

        stepIndex = 1; // Compilation du code via API distante
        updateStepStatus(stepIndex, "in-progress");
      let hexData: Uint8Array;
        try {
          // Pass board type to compile API if it supports it
          const response = await fetch("/api/compile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ino: inoCode, board: boardToUse.value }),
          });
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(
              "Erreur compilation API: " + (errText || response.statusText)
            );
          }
          const arrayBuffer = await response.arrayBuffer();
          hexData = new Uint8Array(arrayBuffer);
          if (hexData.length === 0)
            throw new Error("Le fichier .hex compilé est vide.");
          updateStepStatus(
            stepIndex,
            "completed",
            `Taille du HEX: ${hexData.length} octets`
          );
        } catch (compileError) {
          const errorMsg =
            "Erreur lors de la compilation: " + (compileError as Error).message;
          updateStepStatus(stepIndex, "error", errorMsg);
          setUploadOverallError(errorMsg);
          throw new Error(errorMsg);
        }

      // Utilisation du module uploadArduino (STK500v1/v2)
      stepIndex = 2;
      updateStepStatus(stepIndex, "in-progress", "Préparation à la synchronisation...");

      // Convert Uint8Array to Buffer for AvrgirlArduino compatibility
      const hexBuffer = Buffer.from(hexData);

      // On suppose que portToUse a une propriété .path ou .port (string)
      interface SerialPortWithPath extends MinimalSerialPort {
        path?: string;
        port?: string;
      }
      const portWithPath = portToUse as SerialPortWithPath;
      const portString = portWithPath.path || portWithPath.port || '';
      setPendingUpload({
        board: boardToUse.value,
        port: portString,
        hexFile: hexBuffer,
      });
      } catch (error) {
        console.error("Erreur détaillée du téléversement:", error);
        const finalErrorMessage =
          (error as Error).message || "Une erreur inconnue est survenue.";
        // Ensure error is shown on the current or last relevant step
        const errorStepIndex =
          currentUploadStepIndex < AUTOMATED_UPLOAD_STEPS.length
            ? currentUploadStepIndex
            : AUTOMATED_UPLOAD_STEPS.length - 1;
        if (
          !uploadSteps[errorStepIndex] ||
          uploadSteps[errorStepIndex].status !== "error"
        ) {
          updateStepStatus(errorStepIndex, "error", finalErrorMessage);
        }
        if (!uploadOverallError) {
          // Set overall error only if not already set by a more specific message
          setUploadOverallError(finalErrorMessage);
        }
        setCurrentPhase("finished");
      } finally {
        // Release reader and writer locks
        if (reader) {
          try {
            await reader.cancel();
          } catch (e) {
            console.warn("Avertissement reader.cancel():", e);
          }
          try {
            reader.releaseLock();
          } catch (e) {
            console.warn("Avertissement reader.releaseLock():", e);
          }
          reader = null;
        }
        if (writer) {
          // await writer.close(); // Close is not available on DefaultWriter, use abort for error or let it complete
          try {
            await writer.abort();
          } catch (e) {
            console.warn("Avertissement writer.abort():", e);
          }
          try {
            writer.releaseLock();
          } catch (e) {
            console.warn("Avertissement writer.releaseLock():", e);
          }
          writer = null;
        }
        // Close the port if it was opened by this function
        if (portToUse && typeof portToUse.close === "function") {
          try {
            await portToUse.close();
            console.log("Port série fermé après téléversement.");
          } catch (e) {
            console.error("Erreur fermeture port après téléversement:", e);
            // If port was externally managed (activePort), nullify it here too if it's the same instance
            if (portToUse === activePort) {
              setActivePort(null);
              setIsPortSelected(false);
            }
          }
        }
        // If the port used was the global activePort, and it's now closed, update state
        if (portToUse === activePort) {
          setActivePort(null);
          setIsPortSelected(false); // Port is no longer selected and open
        }
      }
    },
    [
      getProjectDataForSave,
      currentProjectName,
      updateStepStatus,
      uploadOverallError,
      // activePort is not directly used here, portToUse is passed.
      // However, the finally block logic that calls setActivePort(null) implicitly relates to activePort state.
      // For safety, if any part of this function *read* from activePort state, it should be a dep.
      // Since it only *sets* activePort (conditionally), it might be fine without it.
      // Let's keep it minimal for now.
    ]
  );

  const handleInitiateUpload = () => {
    if (!activePort || !selectedBoard) {
      setUploadOverallError(
        "Veuillez sélectionner un modèle de carte et un port série."
      );
      setCurrentPhase("initial_config"); // Stay in config, show error
      return;
    }
    startUploadProcessActual(activePort, selectedBoard);
  };

  useEffect(() => {
    if (triggerUpload) {
      setIsUploadModalOpen(true);
      resetModalStateForNewSession();
    }
    // Note: If triggerUpload becomes false, the modal closes via its isOpen prop.
    // The onUploadFinished callback (called by handleCloseModal) handles parent state.
  }, [triggerUpload, resetModalStateForNewSession]); // resetModalStateForNewSession is stable

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    resetModalStateForNewSession(); // Reset state when modal is explicitly closed
    onUploadFinished();
  };

  return (
    <>
      <UploadStatusModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
        steps={uploadSteps}
        currentStepIndex={currentUploadStepIndex}
        uploadProgress={uploadProgress}
        overallError={uploadOverallError}
        // New props for board and port selection
        availableBoards={AVAILABLE_BOARDS}
        selectedBoard={selectedBoard ? selectedBoard.value : null}
        onBoardChange={handleBoardChange}
        onSelectPort={handleSelectPort}
        onInitiateUpload={handleInitiateUpload}
        isPortSelected={isPortSelected}
        isConnectingPort={isConnectingPort}
        currentPhase={currentPhase}
      />
      {pendingUpload && activePort && (
        <ArduinoUploaderV2
          board={pendingUpload.board}
          port={activePort}
          hexFile={pendingUpload.hexFile}
          onStatus={handleUploaderV2Status}
        />
      )}
    </>
  );
};

export default ArduinoUploader;

/*
TODO Next:

Ajouter un moyen de selectionner son modèle d'arduino pour adapter les commandes STK500.
Corriger les bugs du modal qui ferme et reouvre directement la demande API Web Serial.
Ajouter la gestion de la communication Sérial et ajouter les console.log ardunio
*/
