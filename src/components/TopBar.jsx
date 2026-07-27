import UploadButton from "./UploadButton";

export default function TopBar({ canPrint, noteMode, noteDisabled, onToggleNote }) {
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
        <button
          className={`topbar-btn${noteMode ? " topbar-btn--on" : ""}`}
          onClick={onToggleNote}
          disabled={noteDisabled}
          title={
            noteDisabled
              ? "Notes need a single teacher, student or subject selected"
              : noteMode
                ? "Note mode on — pick a cell (click to exit)"
                : "Note mode"
          }
        >
          ✏️
        </button>
      </div>
    </header>
  );
}
