import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { subjectDisplay } from "../utils/subjectNames";
import { rosterAtSlot, cellDetails } from "../utils/cellDetails";
import { placePanel, PANEL_MIN_W, PANEL_MAX_W } from "../utils/popoutPlacement";

function HeaderActions({ onOpenNote, onClose }) {
  return (
    <span className="popout-header-actions">
      {onOpenNote && (
        <button className="popout-note-btn" onClick={onOpenNote} title="Note for this block">
          ✏️
        </button>
      )}
      <button className="popout-close" onClick={onClose}>×</button>
    </span>
  );
}

function rectOf(el) {
  return el && el.isConnected ? el.getBoundingClientRect() : null;
}

function samePos(a, b) {
  return a && b && a.left === b.left && a.top === b.top &&
    a.maxHeight === b.maxHeight && a.maxWidth === b.maxWidth;
}

// Placement runs in two passes: the panel first renders unclamped and hidden so
// its natural size can be measured, then it is positioned against the anchor's
// *live* rect. Measuring rather than assuming a width is what keeps it beside
// the cell; recomputing on scroll is what keeps it there.
function usePanelPlacement(getAnchor, contentKey) {
  const ref = useRef(null);
  const [state, setState] = useState({ key: contentKey, natural: null, pos: null });

  // Content changed — drop the old measurement and measure again.
  if (state.key !== contentKey) {
    setState({ key: contentKey, natural: null, pos: null });
  }

  useLayoutEffect(() => {
    if (state.natural || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setState(s => ({ ...s, natural: { width: r.width, height: r.height } }));
  }, [state.natural, state.key]);

  const natural = state.natural;

  useLayoutEffect(() => {
    if (!natural) return;
    let raf = 0;

    function compute() {
      raf = 0;
      const anchor = getAnchor();
      if (!anchor) return; // anchor gone — leave the panel where it is
      const pos = placePanel(anchor, natural, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setState(s => (samePos(s.pos, pos) ? s : { ...s, pos }));
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(compute);
    }

    compute();
    // Capture phase so .grid-wrap's own scrolling is caught, not just the window's.
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [natural, getAnchor]);

  return [ref, state.pos];
}

function Panel({ getAnchor, contentKey, children }) {
  const [ref, pos] = usePanelPlacement(getAnchor, contentKey);

  const style = pos
    ? {
        position: "fixed",
        left: pos.left,
        top: pos.top,
        minWidth: PANEL_MIN_W,
        maxWidth: pos.maxWidth,
        width: "max-content",
        maxHeight: pos.maxHeight,
      }
    : {
        position: "fixed",
        left: 0,
        top: 0,
        minWidth: PANEL_MIN_W,
        maxWidth: PANEL_MAX_W,
        width: "max-content",
        visibility: "hidden",
      };

  return (
    <div className="popout-panel" ref={ref} style={style} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  );
}

export default function SubblockPopout({ slot, anchorEl, data, slotMap, mode, activeEntity, onStudentSelect, onOpenNote, onClose }) {
  const [selected, setSelected] = useState(null); // { label, el }
  const labels = slotMap[slot] ?? [];

  const getCellAnchor = useCallback(() => rectOf(anchorEl), [anchorEl]);
  // The student panel anchors to the clicked subject row inside the first
  // panel — a live element, so it tracks that panel without a second guess.
  const selectedEl = selected?.el;
  const getRowAnchor = useCallback(() => rectOf(selectedEl), [selectedEl]);

  function shell(children) {
    return createPortal(
      <div className="popout-overlay popout-overlay--transparent" onClick={onClose}>
        {children}
      </div>,
      document.body
    );
  }

  // Activity mode: labels are prefixed entity IDs (s:10234 / t:BALAY).
  if (mode === "entity" && activeEntity?.type === "activity") {
    const teachers = [];
    const students = [];
    for (const key of labels) {
      const id = key.slice(2);
      if (key.startsWith("t:")) {
        const t = data.teachers[id];
        teachers.push({ id, name: t ? (t.display_name ?? t.surname ?? id) : id });
      } else {
        students.push({ id, name: data.students[id]?.name ?? id });
      }
    }
    teachers.sort((a, b) => a.name.localeCompare(b.name));
    students.sort((a, b) => a.name.localeCompare(b.name));
    const total = teachers.length + students.length;

    return shell(
      <Panel getAnchor={getCellAnchor} contentKey={slot}>
        <div className="popout-header">
          <span className="popout-title">{slot} ({total})</span>
          <HeaderActions onOpenNote={onOpenNote} onClose={onClose} />
        </div>
        <div className="popout-body">
          {total === 0 && <p className="popout-empty">No entries in this block.</p>}
          {teachers.map(t => (
            <div key={`t:${t.id}`} className="popout-student popout-student--teacher">
              {t.name}
            </div>
          ))}
          {students.map(s => (
            <div
              key={`s:${s.id}`}
              className="popout-student"
              onClick={() => { onStudentSelect(s.id); onClose(); }}
            >
              {s.name}
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  // Nothing timetabled — free, duty or an empty school-wide block. Same panel,
  // same note button; cellDetails resolves the free-period code to its label.
  if (labels.length === 0) {
    const items = cellDetails(data, slotMap, slot, mode, activeEntity).items;

    return shell(
      <Panel getAnchor={getCellAnchor} contentKey={slot}>
        <div className="popout-header">
          <span className="popout-title">Block {slot}</span>
          <HeaderActions onOpenNote={onOpenNote} onClose={onClose} />
        </div>
        <div className="popout-body">
          {items.length === 0 ? (
            <p className="popout-empty">No classes in this block.</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="popout-student popout-student--teacher">
                {item.primary}
              </div>
            ))
          )}
        </div>
      </Panel>
    );
  }

  // Entity mode with single subject → skip subject panel, jump to students.
  const directMode = mode === "entity" && labels.length === 1;

  if (directMode) {
    const label = labels[0];
    const students = rosterAtSlot(data, label, slot);
    const subj = data.lessons[label];

    return shell(
      <Panel getAnchor={getCellAnchor} contentKey={slot}>
        <div className="popout-header">
          <span className="popout-title">
            {subjectDisplay(subj.name)} Gr{subj.grade} ({students.length})
          </span>
          <HeaderActions onOpenNote={onOpenNote} onClose={onClose} />
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
      </Panel>
    );
  }

  function handleSubjectClick(label, e) {
    if (selected?.label === label) {
      setSelected(null);
      return;
    }
    setSelected({ label, el: e.currentTarget });
  }

  function handleStudentClick(sid) {
    onStudentSelect(sid);
    onClose();
  }

  let studentPanel = null;
  if (selected) {
    const students = rosterAtSlot(data, selected.label, slot);

    studentPanel = (
      <Panel getAnchor={getRowAnchor} contentKey={selected.label}>
        <div className="popout-header">
          <span className="popout-title">
            {subjectDisplay(data.lessons[selected.label]?.name)} Gr{data.lessons[selected.label]?.grade}
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
      </Panel>
    );
  }

  return shell(
    <>
      <Panel getAnchor={getCellAnchor} contentKey={slot}>
        <div className="popout-header">
          <span className="popout-title">Block {slot}</span>
          <HeaderActions onOpenNote={onOpenNote} onClose={onClose} />
        </div>
        <div className="popout-body">
          {labels.map(label => {
            const subj = data.lessons[label];
            const tObj = subj.teacher ? data.teachers[subj.teacher] : null;
            const teacherName = tObj ? (tObj.display_name ?? tObj.surname ?? "") : "";
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
      </Panel>
      {studentPanel}
    </>
  );
}
