import { useRef, useState } from "react";
import { useAppState } from "../store/appContext";
import { validate, versionMismatch } from "../utils/schema";
import { setHandle } from "../utils/fileHandleStore";

const HAS_FS_ACCESS = typeof window !== "undefined" && "showOpenFilePicker" in window;

export default function UploadButton() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);

  async function handleButtonClick() {
    setError(null);
    if (!HAS_FS_ACCESS) {
      inputRef.current?.click();
      return;
    }
    let handle;
    try {
      [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON file (*.json)",
            accept: {
              "application/json": [".json"],
              "text/json": [".json"],
              "text/plain": [".json"],
            },
          },
        ],
        excludeAcceptAllOption: false,
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(`File picker failed: ${err.message}`);
      return;
    }
    try {
      const file = await handle.getFile();
      const parsed = JSON.parse(await file.text());
      handleParsed(parsed, handle);
    } catch (err) {
      setError(`Couldn't read file: ${err.message}`);
    }
  }

  function handleParsed(parsed, handle) {
    const { ok, errors } = validate(parsed);
    if (!ok && !versionMismatch(parsed)) {
      setError(errors.join(" "));
      return;
    }
    if (versionMismatch(parsed)) {
      setPending({ parsed, handle });
      setError(null);
      return;
    }
    setError(null);
    dispatch({ type: "LOAD_TIMETABLE", payload: parsed });
    if (handle) setHandle(handle);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (evt) => {
      let parsed;
      try {
        parsed = JSON.parse(evt.target.result);
      } catch {
        setError("Invalid JSON file.");
        return;
      }
      handleParsed(parsed);
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    dispatch({ type: "LOAD_TIMETABLE", payload: pending.parsed });
    if (pending.handle) setHandle(pending.handle);
    setPending(null);
  }

  return (
    <div>
      {state.timetableData ? (
        <button className="upload-btn--icon" onClick={handleButtonClick} title="Replace timetable">
          ⚙️
        </button>
      ) : (
        <button className="upload-btn" onClick={handleButtonClick}>
          Upload timetable
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {error && <span className="upload-error">{error}</span>}

      {pending && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <p><strong>Version mismatch</strong></p>
            <p>
              File version <code>{pending.parsed.version}</code> does not match
              expected major version. Load anyway?
            </p>
            <div className="upload-modal-actions">
              <button onClick={handleConfirm}>Load anyway</button>
              <button onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
