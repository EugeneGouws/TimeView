import { useState } from "react";
import { useAppState } from "../store/appState";

export default function LoginDialog({ onSuccess, onClose }) {
  const { dispatch } = useAppState();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (password === import.meta.env.VITE_UPLOAD_KEY) {
      dispatch({ type: "SET_AUTHORIZED", payload: true });
      onSuccess();
    } else {
      setError(true);
    }
  }

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <p><strong>Upload password</strong></p>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            autoFocus
            required
          />
          {error && <p className="upload-error">Incorrect password.</p>}
          <div className="upload-modal-actions">
            <button type="submit">Unlock</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
