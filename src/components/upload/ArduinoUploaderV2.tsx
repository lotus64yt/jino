
import React, { useState } from "react";
// import AvrgirlArduino from "@/lib/avrgirl/arduino-avrgirl";
import { MinimalSerialPort } from "./ArduinoUploader";

// Props: board (string), port (string), hexFile (string|Buffer), onStatus (callback)
interface ArduinoUploaderV2Props {
  board: string;
  port: MinimalSerialPort;
  hexFile: string | Buffer;
  onStatus?: (status: string) => void;
}

const ArduinoUploaderV2: React.FC<ArduinoUploaderV2Props> = ({ board, port, hexFile, onStatus }) => {
  const [status, setStatus] = useState("");

  const handleUpload = () => {
    setStatus("Téléversement en cours...");
    if (onStatus) onStatus("Téléversement en cours...");
    try {
      // AvrgirlArduino is a JS class, so we instantiate it directly
      // @ts-expect-error: AvrgirlArduino is a JS class, not typed
      const avrgirl = new AvrgirlArduino({
        board,
        port,
        debug: false,
      });
      avrgirl.flash(hexFile, (err: unknown) => {
        if (err) {
          const msg = (typeof err === 'object' && err && 'message' in err) ? (err as { message: string }).message : String(err);
          setStatus("Échec du téléversement : " + msg);
          if (onStatus) onStatus("Échec du téléversement : " + msg);
        } else {
          setStatus("Téléversement réussi !");
          if (onStatus) onStatus("Téléversement réussi !");
        }
      });
    } catch (e) {
      const msg = (e && typeof e === 'object' && 'message' in e) ? (e as { message: string }).message : String(e);
      setStatus("Erreur : " + msg);
      if (onStatus) onStatus("Erreur : " + msg);
    }
  };

  return (
    <div>
      <button onClick={handleUpload}>Téléverser sur Arduino</button>
      <div>Status: {status}</div>
    </div>
  );
};

export default ArduinoUploaderV2;