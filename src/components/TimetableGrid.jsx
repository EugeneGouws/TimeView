import { TIMETABLE_GRID } from "../utils/timetableLayout";
import { subjectDisplay } from "../utils/subjectNames";
import { ACTIVITY_LABEL, isSoftFree } from "../utils/activityLabels";

function freeSlotCode(data, entityType, entityId, slot) {
  const bucket = entityType === "student"
    ? data?.free_periods?.students
    : data?.free_periods?.teachers;
  return bucket?.[entityId]?.[slot] ?? null;
}

const REG_LETTERS = ["R", "E", "G", "", "R", "E", "G", ""];
const BREAK_LETTERS = ["", "B", "R", "E", "A", "K", "", ""];

function formatLines(data, labels, entityType) {
  return labels.map(label => {
    const subj = data.lessons[label];
    const name = subjectDisplay(subj.name);
    const t = subj.teacher ? data.teachers[subj.teacher] : null;
    const teacherName = t ? (t.display_name ?? t.surname ?? "") : "";
    if (entityType === "teacher") return `${name}  Gr${subj.grade}`;
    if (entityType === "student") return `${name}  ${teacherName}`;
    return `${name}  ${teacherName}  Gr${subj.grade}`;
  });
}

function captureRects(e) {
  const r = e.currentTarget.getBoundingClientRect();
  const wrap = e.currentTarget.closest(".grid-wrap");
  const gr = wrap ? wrap.getBoundingClientRect() : null;
  return {
    cellRect: {
      top: r.top, left: r.left, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height,
    },
    gridRect: gr
      ? { top: gr.top, bottom: gr.bottom, left: gr.left, right: gr.right, height: gr.height }
      : null,
  };
}

// Comparison overlay: one cell shows every source's lessons colour-coded, and
// highlights slots where all teacher/student sources are free.
function OverlayCell({ slot, sources, data, onCellClick }) {
  const perSource = sources.map(src => {
    const labels = src.slotMap[slot] ?? [];
    const isPersonal = src.entity.type === "student" || src.entity.type === "teacher";
    const freeCode = isPersonal && labels.length === 0
      ? freeSlotCode(data, src.entity.type, src.entity.id, slot)
      : null;
    return {
      colorIdx: src.colorIdx,
      lines: labels.length ? formatLines(data, labels, src.entity.type) : [],
      isPersonal,
      freeCode,
      busy: labels.length > 0,
    };
  });

  const anyBusy = perSource.some(p => p.busy);
  const personalCount = perSource.filter(p => p.isPersonal).length;
  const sharedFree = !anyBusy && personalCount >= 2;
  const softFree = sharedFree && perSource.some(p => p.isPersonal && isSoftFree(p.freeCode));

  function handleClick(e) {
    const { cellRect, gridRect } = captureRects(e);
    onCellClick(slot, cellRect, gridRect);
  }

  const freeCls = sharedFree
    ? (softFree ? " grid-cell--shared-free--soft" : " grid-cell--shared-free")
    : "";
  const cls = `grid-cell grid-cell--overlay${freeCls}${anyBusy ? " grid-cell--clickable" : ""}`;
  return (
    <td className={cls} onClick={anyBusy ? handleClick : undefined}>
      {perSource.map((p, si) => (
        <div key={si} className={`grid-overlay-group grid-line--c${p.colorIdx}`}>
          {p.busy
            ? p.lines.map((line, i) => (
                <div key={i} className="grid-subject-line">{line}</div>
              ))
            : p.isPersonal && (
                <div className="grid-subject-line grid-overlay-free">
                  {p.freeCode ? (ACTIVITY_LABEL[p.freeCode] ?? p.freeCode) : "Free"}
                </div>
              )}
        </div>
      ))}
    </td>
  );
}

// Cells with more entries than this get cramped by default; the cell-edge
// +/− control (App.jsx `expandAll`) reveals the rest grid-wide.
const OVERFLOW_LIMIT = 3;

function EntryLine({ item }) {
  return (
    <>
      <div className={`grid-subject-line${item.bold ? " grid-subject-line--bold" : ""}`}>
        {item.text}
      </div>
      {item.children?.map((name, i) => (
        <div key={i} className="grid-nested-line">{name}</div>
      ))}
    </>
  );
}

// Expanded: every entry plus its nested roster. Collapsed: first OVERFLOW_LIMIT
// top-level lines, rest in a CSS-hidden group (kept in the DOM so the toggle is
// pure CSS), nested rosters dropped entirely.
function renderEntries(items, expandAll) {
  if (expandAll) {
    return items.map((item, i) => <EntryLine key={i} item={item} />);
  }
  const shown = items.slice(0, OVERFLOW_LIMIT);
  const rest = items.slice(OVERFLOW_LIMIT);
  return (
    <>
      {shown.map((item, i) => (
        <div key={i} className={`grid-subject-line${item.bold ? " grid-subject-line--bold" : ""}`}>
          {item.text}
        </div>
      ))}
      {rest.length > 0 && (
        <div className="grid-cell-overflow-group">
          {rest.map((item, i) => (
            <div key={i} className={`grid-subject-line${item.bold ? " grid-subject-line--bold" : ""}`}>
              {item.text}
            </div>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid-subject-line grid-overflow">({rest.length} more)</div>
      )}
    </>
  );
}

function LessonCell({
  slot, labels, mode, entityType, data, activeEntity,
  onCellClick, noted, selected, noteText, expandAll, rosterIndex,
}) {
  const hasClasses = labels.length > 0;

  // Free-period activity for this slot (entity mode, student/teacher).
  const freeCode =
    mode === "entity" && activeEntity && (activeEntity.type === "student" || activeEntity.type === "teacher")
      ? freeSlotCode(data, activeEntity.type, activeEntity.id, slot)
      : null;

  function handleOccupiedClick(e) {
    const { cellRect, gridRect } = captureRects(e);
    onCellClick(slot, cellRect, gridRect);
  }

  // Every cell is clickable — frees and empties select without opening a detail
  // pane, so they can be noted like any other cell.
  const stateCls =
    (noted ? " grid-cell--noted" : "") + (selected ? " grid-cell--selected" : "");

  // Lesson entries with their roster nested underneath — only built when
  // expanded, since the roster index is only computed then.
  function lessonEntries(forEntityType) {
    return formatLines(data, labels, forEntityType).map((text, i) => ({
      text,
      bold: false,
      children: expandAll ? (rosterIndex?.[slot]?.[labels[i]] ?? []) : undefined,
    }));
  }

  // Activity-view student entries, normal weight.
  function studentEntries() {
    return labels
      .filter(l => l.startsWith("s:"))
      .map(l => ({ text: data.students[l.slice(2)]?.name ?? l, bold: false }));
  }

  let cellCls;
  let body = null;

  if (mode === "school") {
    cellCls = `grid-cell grid-cell--school${hasClasses ? " grid-cell--occupied" : " grid-cell--empty"}`;
    body = expandAll && hasClasses ? renderEntries(lessonEntries(null), true) : slot;
  } else if (!hasClasses) {
    if (freeCode) {
      cellCls = `grid-cell grid-cell--free${isSoftFree(freeCode) ? " grid-cell--free--soft" : ""}`;
      body = <div className="grid-free-line">{ACTIVITY_LABEL[freeCode] ?? freeCode}</div>;
    } else {
      cellCls = "grid-cell grid-cell--empty";
    }
  } else if (entityType === "activity") {
    cellCls = "grid-cell grid-cell--active";
    const activityId = activeEntity?.id;
    const TEACHER_NAME_CODES = ["LIB", "BAT", "MEETING"];

    if (TEACHER_NAME_CODES.includes(activityId)) {
      const teacherItems = labels
        .filter(l => l.startsWith("t:"))
        .map(l => {
          const t = data.teachers[l.slice(2)];
          return { text: t ? (t.display_name ?? t.surname) : l, bold: expandAll };
        });
      // Collapsed these cells are a staff list; expanded they reveal the
      // learners on the same code, so the cell holds the full roster.
      const items = expandAll ? [...teacherItems, ...studentEntries()] : teacherItems;
      body = items.length === 0
        ? <div className="grid-subject-line">{slot} ({labels.length})</div>
        : renderEntries(items, expandAll);
    } else {
      // STUDY and every other activity (EXTRA/LAB/FREE/etc.) — mixed
      // teacher+student entries, teachers bolded.
      const tEntries = labels
        .filter(l => l.startsWith("t:"))
        .map(l => {
          const t = data.teachers[l.slice(2)];
          return { text: t ? (t.display_name ?? t.surname) : l, bold: true };
        });
      body = renderEntries([...tEntries, ...studentEntries()], expandAll);
    }
  } else {
    cellCls = "grid-cell grid-cell--active";
    body = renderEntries(lessonEntries(entityType), expandAll);
  }

  const expandedCls = expandAll ? " grid-cell--expanded" : "";

  return (
    <td className={`${cellCls}${stateCls}${expandedCls}`} onClick={handleOccupiedClick}>
      {body}
      {noteText && <div className="grid-note-inline">{noteText}</div>}
    </td>
  );
}

export default function TimetableGrid({
  slotMap, data, activeEntity, mode, entityType,
  overlaySources, onCellClick, notedSlots, noteTextMap, selectedSlot, expandAll,
  rosterIndex, onToggleExpandAll,
}) {
  return (
    <div className="grid-wrap">
      <table className="timetable-grid">
        <thead>
          <tr>
            <th className="grid-day-header">Day</th>
            <th className="grid-period-header">1</th>
            <th className="grid-period-header">2</th>
            <th className="grid-reg-header" />
            <th className="grid-break-header" />
            <th className="grid-period-header">3</th>
            <th className="grid-period-header">4</th>
            <th className="grid-period-header">5</th>
            <th className="grid-break-header" />
            <th className="grid-period-header">6</th>
            {/* One control for the whole grid, parked in the last period header. */}
            <th className="grid-period-header grid-period-header--last">
              7
              <button
                className="grid-expand-toggle"
                onClick={onToggleExpandAll}
                title={expandAll ? "Collapse all cells" : "Expand all cells"}
              >
                {expandAll ? "−" : "+"}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {TIMETABLE_GRID.map((row, idx) => {
            const cell = (period) => {
              const slot = row[period - 1];
              if (overlaySources) {
                return (
                  <OverlayCell
                    key={period}
                    slot={slot}
                    sources={overlaySources}
                    data={data}
                    onCellClick={onCellClick}
                  />
                );
              }
              return (
                <LessonCell
                  key={period}
                  slot={slot}
                  labels={slotMap[slot] ?? []}
                  mode={mode}
                  entityType={entityType}
                  data={data}
                  activeEntity={activeEntity}
                  onCellClick={onCellClick}
                  noted={notedSlots?.has(slot)}
                  noteText={noteTextMap?.get(slot)}
                  selected={selectedSlot === slot}
                  expandAll={expandAll}
                  rosterIndex={rosterIndex}
                />
              );
            };
            return (
              <tr key={idx}>
                <td className="grid-block-label">{idx + 1}</td>
                {cell(1)}
                {cell(2)}
                <td className="grid-reg-cell">{REG_LETTERS[idx]}</td>
                <td className="grid-break-cell">{BREAK_LETTERS[idx]}</td>
                {cell(3)}
                {cell(4)}
                {cell(5)}
                <td className="grid-break-cell">{BREAK_LETTERS[idx]}</td>
                {cell(6)}
                {cell(7)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
