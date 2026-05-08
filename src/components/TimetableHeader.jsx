import { useMemo } from "react";

const SCHOOL_NAME = "Crawford International La Lucia";

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function TimetableHeader({ data, activeEntity }) {
  const today = useMemo(() => formatDate(new Date()), []);

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

  return (
    <div className="tt-header">
      <div className="tt-header-row tt-header-row-1">
        <div className="tt-header-date">{today}</div>
        <div className="tt-header-school">{SCHOOL_NAME}</div>
        <div className="tt-header-meta" />
      </div>
      <div className="tt-header-row tt-header-row-2">
        <div className="tt-header-name">{personName}</div>
        <div className="tt-header-title">{title}</div>
        <div className="tt-header-year">{year}</div>
      </div>
    </div>
  );
}
