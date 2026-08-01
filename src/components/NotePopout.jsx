import { useState } from "react";
import { slotPosition } from "../utils/timetableLayout";

export default function NotePopout({
  slot, title, details, initialText, initialDisplayMode, onSave, onClearAll, onClose,
}) {
  const [text, setText] = useState(initialText ?? "");
  const [displayMode, setDisplayMode] = useState(initialDisplayMode ?? "dot");
  const hasExisting = Boolean(initialText);
  const items = details?.items ?? [];
  const pos = slotPosition(slot);
  const where = pos ? `Day ${pos.day} Lesson ${pos.period} · ` : "";

  return (
    <div className="popout-overlay" onClick={onClose}>
      <div className="popout note-popout" onClick={e => e.stopPropagation()}>
        <div className="popout-header">
          <span className="popout-title">Note — {title} · {where}{slot}</span>
          <button className="popout-close" onClick={onClose}>×</button>
        </div>

        <div className="note-columns">
          <div className="note-details">
            <div className="note-details-heading">Block {slot}</div>
            {items.length === 0 ? (
              <p className="popout-empty">Nothing in this block.</p>
            ) : (
              items.map((item, i) => (
                <div key={i} className="note-details-item">
                  <span className="note-details-primary">{item.primary}</span>
                  {item.secondary && <span className="note-details-secondary">{item.secondary}</span>}
                  {item.count != null && <span className="note-details-count">({item.count})</span>}
                  {item.students?.length > 0 && (
                    <ul className="note-details-students">
                      {item.students.map(name => <li key={name}>{name}</li>)}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>

          <textarea
            className="note-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Absentees, reminders, checklist…"
            autoFocus
          />
        </div>

        <div className="note-display-toggle">
          <span className="note-display-toggle-label">Show as:</span>
          <button
            className={`note-btn note-btn--toggle${displayMode === "dot" ? " note-btn--on" : ""}`}
            onClick={() => setDisplayMode("dot")}
          >
            Dot
          </button>
          <button
            className={`note-btn note-btn--toggle${displayMode === "inline" ? " note-btn--on" : ""}`}
            onClick={() => setDisplayMode("inline")}
          >
            Full text in cell
          </button>
        </div>

        <div className="note-caution">Saved on this device only. Not synced, not backed up.</div>
        <div className="note-actions">
          <button className="note-btn note-btn--primary" onClick={() => onSave(text, displayMode)}>Save</button>
          {hasExisting && (
            <button className="note-btn" onClick={() => onSave("", displayMode)}>Delete</button>
          )}
          <button className="note-btn" onClick={onClose}>Cancel</button>
          <button
            className="note-btn note-btn--danger"
            onClick={() => {
              if (window.confirm("Delete every note stored on this device?")) onClearAll();
            }}
          >
            Clear all notes
          </button>
        </div>
      </div>
    </div>
  );
}
