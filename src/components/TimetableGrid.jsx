import { BLOCKS, PERIODS } from "../utils/timetableLayout";
import { subjectDisplay } from "../utils/subjectNames";

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

function LessonCell({ slot, labels, mode, entityType, data, onCellClick }) {
  const hasClasses = labels.length > 0;

  function handleClick(e) {
    if (!hasClasses) return;
    const r = e.currentTarget.getBoundingClientRect();
    const wrap = e.currentTarget.closest(".grid-wrap");
    const gr = wrap ? wrap.getBoundingClientRect() : null;
    onCellClick(
      slot,
      {
        top: r.top, left: r.left, right: r.right, bottom: r.bottom,
        width: r.width, height: r.height,
      },
      gr
        ? { top: gr.top, bottom: gr.bottom, left: gr.left, right: gr.right, height: gr.height }
        : null
    );
  }

  if (mode === "school") {
    return (
      <td
        className={`grid-cell grid-cell--school${hasClasses ? " grid-cell--occupied" : " grid-cell--empty"}`}
        onClick={handleClick}
      >
        {slot}
      </td>
    );
  }
  const lines = formatLines(data, labels, entityType);
  return (
    <td
      className={`grid-cell ${hasClasses ? "grid-cell--active" : "grid-cell--empty"}`}
      onClick={handleClick}
    >
      {lines.map((line, i) => (
        <div key={i} className="grid-subject-line">{line}</div>
      ))}
    </td>
  );
}

export default function TimetableGrid({ slotMap, data, mode, entityType, onCellClick }) {
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
          {BLOCKS.map((block, idx) => {
            const cell = (period) => (
              <LessonCell
                key={period}
                slot={`${block}${period}`}
                labels={slotMap[`${block}${period}`] ?? []}
                mode={mode}
                entityType={entityType}
                data={data}
                onCellClick={onCellClick}
              />
            );
            return (
              <tr key={block}>
                <td className="grid-block-label">{block}</td>
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
