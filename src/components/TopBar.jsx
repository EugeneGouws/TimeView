import UploadButton from "./UploadButton";

export default function TopBar({ canPrint }) {
  return (
    <header className="topbar">
      <span className="topbar-title">TimeView</span>
      <div className="topbar-right">
        <UploadButton />
        {canPrint && (
          <button className="topbar-btn" onClick={() => window.print()} title="Print timetable">
            🖨
          </button>
        )}
      </div>
    </header>
  );
}
