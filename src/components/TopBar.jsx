import UploadButton from "./UploadButton";
import { useAppState } from "../store/appState";

export default function TopBar() {
  const { state, dispatch } = useAppState();
  return (
    <header className="topbar">
      <span className="topbar-title">TimeView</span>
      <div className="topbar-right">
        <button
          className={`login-btn${state.authorized ? " login-btn--active" : ""}`}
          onClick={() => dispatch({ type: "TOGGLE_AUTHORIZED" })}
        >
          {state.authorized ? "Logout" : "Login"}
        </button>
        <UploadButton />
      </div>
    </header>
  );
}
