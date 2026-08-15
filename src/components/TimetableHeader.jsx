import { schoolName, regTeacherName } from "../utils/regClasses";

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// The date the timetable was generated, never today's — a wall-clock fallback
// would silently reintroduce the bug this replaced.
function generatedDate(data) {
  if (!data?.generated_at) return "—";
  const d = new Date(data.generated_at);
  return isNaN(d.getTime()) ? "—" : formatDate(d);
}

export default function TimetableHeader({ data, activeEntity }) {
  if (!data || !activeEntity || activeEntity.type === "subject") return null;

  const isStudent = activeEntity.type === "student";
  const person = isStudent
    ? data.students[activeEntity.id]
    : data.teachers[activeEntity.id];
  if (!person) return null;

  const personName = isStudent
    ? (person.name ?? activeEntity.id)
    : (person.display_name ?? person.surname ?? activeEntity.id);
  const title = isStudent ? "Student Personal Timetable" : "Teacher Personal Timetable";
  const year = isStudent
    ? (person.reg_class ?? person.grade ?? "")
    : (person.venue ?? "");

  const regTeacher = isStudent ? regTeacherName(data, person.reg_class) : null;

  return (
    <div className="tt-header">
      <div className="tt-header-row tt-header-row-1">
        <div className="tt-header-date">{generatedDate(data)}</div>
        <div className="tt-header-school">{schoolName(data)}</div>
        <div className="tt-header-meta">{regTeacher ? `Reg: ${regTeacher}` : ""}</div>
      </div>
      <div className="tt-header-row tt-header-row-2">
        <div className="tt-header-name">{personName}</div>
        <div className="tt-header-title">{title}</div>
        <div className="tt-header-year">{year}</div>
      </div>
    </div>
  );
}
