import { useState } from "react";
import { subjectDisplay } from "../utils/subjectNames";

function rosterAtSlot(data, label, slot) {
  const ss = data.student_slots ?? {};
  const out = [];
  for (const [sid, slots] of Object.entries(ss)) {
    if (slots[slot] === label) {
      out.push({ sid, name: data.students[sid]?.name ?? sid });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const PANEL_W = 240;       // reserved horizontal space for placement
const PANEL_MIN_W = 200;
const PANEL_MAX_W = 440;
const GAP = 4;
const MARGIN = 8;
const MIN_PANEL_H = 120;

function placeHorizontal(anchorRect) {
  const spaceRight = window.innerWidth - anchorRect.right - GAP - MARGIN;
  const spaceLeft = anchorRect.left - GAP - MARGIN;
  if (spaceRight >= PANEL_W) return { left: anchorRect.right + GAP };
  if (spaceLeft >= PANEL_W) return { left: anchorRect.left - PANEL_W - GAP };
  // Neither fits — prefer the larger side, clamp to viewport edge
  if (spaceRight >= spaceLeft) {
    return { left: Math.max(MARGIN, window.innerWidth - PANEL_W - MARGIN) };
  }
  return { left: MARGIN };
}

function placeVertical(anchorTop) {
  const spaceBelow = window.innerHeight - anchorTop - MARGIN;
  if (spaceBelow >= MIN_PANEL_H) {
    return { top: anchorTop, maxHeight: spaceBelow };
  }
  // Flip upward: anchor bottom of panel to anchorTop + anchor.height (~0 known)
  // Use available space above anchorTop
  const spaceAbove = anchorTop - MARGIN;
  const h = Math.max(MIN_PANEL_H, spaceAbove);
  return { top: Math.max(MARGIN, anchorTop - h), maxHeight: spaceAbove };
}

export default function SubblockPopout({ slot, cellRect, gridRect, data, slotMap, mode, activeEntity, onStudentSelect, onClose }) {
  const [selected, setSelected] = useState(null); // { label, itemRect }
  const labels = slotMap[slot] ?? [];

  // Activity mode: labels are prefixed entity IDs (s:10234 / t:BALAY).
  if (mode === "entity" && activeEntity?.type === "activity") {
    const rows = labels.map(key => {
      const kind = key.startsWith("t:") ? "teacher" : "student";
      const id = key.slice(2);
      const name = kind === "teacher"
        ? (data.teachers[id]?.name ?? id)
        : (data.students[id]?.name ?? id);
      return { kind, id, name };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const pos = gridRect
      ? { ...placeHorizontal(cellRect), top: gridRect.top + 4, maxHeight: gridRect.height - 8 }
      : { ...placeHorizontal(cellRect), ...placeVertical(cellRect.top) };

    return (
      <div className="popout-overlay popout-overlay--transparent" onClick={onClose}>
        <div
          className="popout-panel"
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            minWidth: PANEL_MIN_W,
            maxWidth: PANEL_MAX_W,
            width: "max-content",
            maxHeight: pos.maxHeight,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="popout-header">
            <span className="popout-title">{slot} ({rows.length})</span>
            <button className="popout-close" onClick={onClose}>×</button>
          </div>
          <div className="popout-body">
            {rows.length === 0 && <p className="popout-empty">No entries in this block.</p>}
            {rows.map(r => (
              <div
                key={`${r.kind}:${r.id}`}
                className="popout-student"
                onClick={() => {
                  if (r.kind === "student") { onStudentSelect(r.id); onClose(); }
                }}
              >
                {r.name} <span className="popout-class-count">({r.kind})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Entity mode with single subject → skip subject panel, jump to students.
  const directMode = mode === "entity" && labels.length === 1;

  // First panel: fill grid height if gridRect known, else fall back.
  const subjectPos = gridRect
    ? {
        ...placeHorizontal(cellRect),
        top: gridRect.top + 4,
        maxHeight: gridRect.height - 8,
      }
    : {
        ...placeHorizontal(cellRect),
        ...placeVertical(cellRect.top),
      };

  // Second panel: flip up or down based on click position in grid.
  function placeStudentPanel(itemRect, subjectPanelRect) {
    const horizontal = placeHorizontal(subjectPanelRect);
    if (!gridRect) return { ...horizontal, ...placeVertical(itemRect.top) };

    const midpoint = gridRect.top + gridRect.height / 2;
    const clickBelowMid = itemRect.top > midpoint;
    if (clickBelowMid) {
      // Open upward: bottom aligns with item bottom, grow up to gridRect.top
      const maxH = Math.max(MIN_PANEL_H, itemRect.bottom - gridRect.top - 4);
      return { ...horizontal, top: Math.max(gridRect.top + 4, itemRect.bottom - maxH), maxHeight: maxH };
    }
    // Open downward from item top
    const maxH = Math.max(MIN_PANEL_H, gridRect.bottom - itemRect.top - 4);
    return { ...horizontal, top: itemRect.top, maxHeight: maxH };
  }

  if (directMode) {
    const label = labels[0];
    const students = rosterAtSlot(data, label, slot);
    const subj = data.subjects[label];

    const directPos = placeStudentPanel(cellRect, cellRect);

    return (
      <div className="popout-overlay popout-overlay--transparent" onClick={onClose}>
        <div
          className="popout-panel"
          style={{
            position: "fixed",
            left: directPos.left,
            top: directPos.top,
            minWidth: PANEL_MIN_W,
            maxWidth: PANEL_MAX_W,
            width: "max-content",
            maxHeight: directPos.maxHeight,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="popout-header">
            <span className="popout-title">
              {subjectDisplay(subj.name)} Gr{subj.grade} ({students.length})
            </span>
            <button className="popout-close" onClick={onClose}>×</button>
          </div>
          <div className="popout-body">
            {students.map(({ sid, name }) => (
              <div
                key={sid}
                className="popout-student"
                onClick={() => { onStudentSelect(sid); onClose(); }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function handleSubjectClick(label, e) {
    if (selected?.label === label) {
      setSelected(null);
      return;
    }
    const itemRect = e.currentTarget.getBoundingClientRect();
    setSelected({ label, itemRect });
  }

  function handleStudentClick(sid) {
    onStudentSelect(sid);
    onClose();
  }

  let studentPanel = null;
  if (selected) {
    const subjectPanelRect = {
      left: subjectPos.left,
      right: subjectPos.left + PANEL_W,
      top: subjectPos.top,
      bottom: subjectPos.top + (subjectPos.maxHeight ?? 320),
    };
    const students = rosterAtSlot(data, selected.label, slot);

    const studentPos = placeStudentPanel(selected.itemRect, subjectPanelRect);

    studentPanel = (
      <div
        className="popout-panel"
        style={{
          position: "fixed",
          left: studentPos.left,
          top: studentPos.top,
          minWidth: PANEL_MIN_W,
          maxWidth: PANEL_MAX_W,
          width: "max-content",
          maxHeight: studentPos.maxHeight,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="popout-header">
          <span className="popout-title">
            {subjectDisplay(data.subjects[selected.label]?.name)} Gr{data.subjects[selected.label]?.grade}
          </span>
          <span className="popout-class-count">({students.length})</span>
        </div>
        <div className="popout-body">
          {students.map(({ sid, name }) => (
            <div
              key={sid}
              className="popout-student"
              onClick={() => handleStudentClick(sid)}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="popout-overlay popout-overlay--transparent" onClick={onClose}>
      <div
        className="popout-panel"
        style={{
          position: "fixed",
          left: subjectPos.left,
          top: subjectPos.top,
          minWidth: PANEL_MIN_W,
          maxWidth: PANEL_MAX_W,
          width: "max-content",
          maxHeight: subjectPos.maxHeight,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="popout-header">
          <span className="popout-title">Block {slot}</span>
          <button className="popout-close" onClick={onClose}>×</button>
        </div>
        <div className="popout-body">
          {labels.length === 0 && (
            <p className="popout-empty">No classes in this block.</p>
          )}
          {labels.map(label => {
            const subj = data.subjects[label];
            const teacherName = subj.teacher
              ? (data.teachers[subj.teacher]?.name ?? "")
              : "";
            const count = rosterAtSlot(data, label, slot).length;
            const isActive = selected?.label === label;
            return (
              <div
                key={label}
                className={`popout-class-header${isActive ? " popout-class-header--open" : ""}`}
                onClick={(e) => handleSubjectClick(label, e)}
              >
                <span className="popout-class-name">
                  {subjectDisplay(subj.name)} Gr{subj.grade}
                </span>
                <span className="popout-class-teacher">{teacherName}</span>
                <span className="popout-class-count">({count})</span>
              </div>
            );
          })}
        </div>
      </div>
      {studentPanel}
    </div>
  );
}
