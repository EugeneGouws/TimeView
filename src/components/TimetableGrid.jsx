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
    const subj = data.subjects[label];
    const name = subjectDisplay(subj.name);
    const teacherName = subj.teacher ? (data.teachers[subj.teacher]?.name ?? "") : "";
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
    return (
      <td
        className="grid-cell grid-cell--active"
        onClick={handleOccupiedClick}
      >
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
  onCellClick,
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
