import { useRef, useState } from "react";
import { useAppState } from "../store/appState";
import { validate, versionMismatch } from "../utils/schema";
import { convertXlsxToTimetable } from "../utils/xlsxToTimetable";
import LoginDialog from "./LoginDialog";

export default function UploadButton() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  function handleButtonClick() {
    setError(null);
    if (!state.authorized) {
      setShowLogin(true);
    } else {
      inputRef.current?.click();
    }
  }

  function handleLoginSuccess() {
    setShowLogin(false);
    inputRef.current?.click();
  }

  function handleParsed(parsed) {
    const { ok, errors } = validate(parsed);
    if (!ok && !versionMismatch(parsed)) {
      setError(errors.join(" "));
      return;
    }
    if (versionMismatch(parsed)) {
      setPending(parsed);
      setError(null);
      return;
    }
    setError(null);
    dispatch({ type: "LOAD_TIMETABLE", payload: parsed });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const lower = file.name.toLowerCase();
    const isXlsx = lower.endsWith(".xlsx") || lower.endsWith(".xls");

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (isXlsx) {
        try {
          const parsed = convertXlsxToTimetable(evt.target.result, file.name);
          handleParsed(parsed);
        } catch (err) {
          setError(`xlsx conversion failed: ${err.message}`);
        }
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(evt.target.result);
      } catch {
        setError("Invalid JSON file.");
        return;
      }
      handleParsed(parsed);
    };
    if (isXlsx) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }

  function handleConfirm() {
    dispatch({ type: "LOAD_TIMETABLE", payload: pending });
    setPending(null);
  }

  return (
    <div>
      {state.timetableData ? (
        <button className="upload-btn--icon" onClick={handleButtonClick} title="Replace timetable">
          🔧
        </button>
      ) : (
        <button className="upload-btn" onClick={handleButtonClick}>
          Upload timetable
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".json,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {error && <span className="upload-error">{error}</span>}

      {pending && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <p><strong>Version mismatch</strong></p>
            <p>
              File version <code>{pending.version}</code> does not match
              expected major version. Load anyway?
            </p>
            <div className="upload-modal-actions">
              <button onClick={handleConfirm}>Load anyway</button>
              <button onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <LoginDialog
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
