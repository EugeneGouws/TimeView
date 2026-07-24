import { TIMETABLE_GRID } from "../utils/timetableLayout";
import { subjectDisplay } from "../utils/subjectNames";
import { ACTIVITY_LABEL } from "../utils/activityLabels";

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

  function handleClick(e) {
    const { cellRect, gridRect } = captureRects(e);
    onCellClick(slot, cellRect, gridRect);
  }

  const cls = `grid-cell grid-cell--overlay${sharedFree ? " grid-cell--shared-free" : ""}${anyBusy ? " grid-cell--clickable" : ""}`;
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

function LessonCell({
  slot, labels, mode, entityType, data, activeEntity,
  onCellClick,
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

  if (mode === "school") {
    return (
      <td
        className={`grid-cell grid-cell--school${hasClasses ? " grid-cell--occupied" : " grid-cell--empty"}`}
        onClick={hasClasses ? handleOccupiedClick : undefined}
      >
        {slot}
      </td>
    );
  }

  if (!hasClasses) {
    if (freeCode) {
      return (
        <td className="grid-cell grid-cell--free">
          <div className="grid-free-line">{ACTIVITY_LABEL[freeCode] ?? freeCode}</div>
        </td>
      );
    }
    return <td className="grid-cell grid-cell--empty" />;
  }

  if (entityType === "activity") {
    const activityId = activeEntity?.id;
    const TEACHER_NAME_CODES = ["LIB", "BAT", "MEETING"];

    if (TEACHER_NAME_CODES.includes(activityId)) {
      const teacherNames = labels
        .filter(l => l.startsWith("t:"))
        .map(l => {
          const t = data.teachers[l.slice(2)];
          return t ? (t.display_name ?? t.surname) : l;
        });
      const total = teacherNames.length;
      if (total === 0) {
        return (
          <td className="grid-cell grid-cell--active" onClick={handleOccupiedClick}>
            <div className="grid-subject-line">{slot} ({labels.length})</div>
          </td>
        );
      }
      const shown = total > 3 ? teacherNames.slice(0, 2) : teacherNames;
      const overflow = total > 3 ? total - 2 : 0;
      return (
        <td className="grid-cell grid-cell--active" onClick={handleOccupiedClick}>
          {shown.map((name, i) => <div key={i} className="grid-subject-line">{name}</div>)}
          {overflow > 0 && <div className="grid-subject-line grid-overflow">({overflow} more)</div>}
        </td>
      );
    }

    if (activityId === "STUDY") {
      const tEntries = labels
        .filter(l => l.startsWith("t:"))
        .map(l => {
          const t = data.teachers[l.slice(2)];
          return { name: t ? (t.display_name ?? t.surname) : l, teacher: true };
        });
      const sEntries = labels
        .filter(l => l.startsWith("s:"))
        .map(l => {
          const s = data.students[l.slice(2)];
          return { name: s?.name ?? l, teacher: false };
        });
      const all = [...tEntries, ...sEntries];
      const total = all.length;
      return (
        <td className="grid-cell grid-cell--active" onClick={handleOccupiedClick}>
          {total > 3
            ? <div className="grid-subject-line">{slot} ({total})</div>
            : all.map((item, i) => (
                <div key={i} className={`grid-subject-line${item.teacher ? " grid-subject-line--bold" : ""}`}>
                  {item.name}
                </div>
              ))
          }
        </td>
      );
    }

    return (
      <td className="grid-cell grid-cell--active" onClick={handleOccupiedClick}>
        <div className="grid-subject-line">{slot} ({labels.length})</div>
      </td>
    );
  }

  const lines = formatLines(data, labels, entityType);
  return (
    <td
      className="grid-cell grid-cell--active"
      onClick={handleOccupiedClick}
    >
      {lines.map((line, i) => (
        <div key={i} className="grid-subject-line">{line}</div>
      ))}
    </td>
  );
}

export default function TimetableGrid({
  slotMap, data, activeEntity, mode, entityType,
  overlaySources, onCellClick,
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
            <th className="grid-period-header">7</th>
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
