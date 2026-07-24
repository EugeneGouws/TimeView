import { useState, useMemo } from "react";
import { useAppState } from "../store/appState";
import { subjectDisplay } from "../utils/subjectNames";
import { ACTIVITY_LABEL } from "../utils/activityLabels";

const ACTIVITY_CODES = ["LIB", "STUDY", "BAT", "MEETING"];

function teacherList(data) {
  return Object.entries(data.teachers)
    .map(([id, t]) => ({ id, label: t.display_name ?? t.surname ?? id, kind: "teacher" }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function studentList(data) {
  return Object.entries(data.students)
    .map(([id, s]) => ({ id, label: s.name ? `${s.name} (${id})` : id, kind: "student" }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function subjectList(data) {
  const codes = new Set(Object.values(data.lessons).map(s => s.name));
  return [...codes]
    .map(code => ({ id: code, label: `${subjectDisplay(code)} (${code})`, kind: "subject" }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildList(data, type) {
  if (type === "teacher") return teacherList(data);
  if (type === "student") return studentList(data);
  // "compare" = teacher + student + subject (no activities)
  if (type === "compare") {
    return [...teacherList(data), ...studentList(data), ...subjectList(data)];
  }
  // subject box: activities prepended before subjects
  const activities = ACTIVITY_CODES.map(code => ({
    id: code,
    label: code === "STUDY" ? "Study / Free" : ACTIVITY_LABEL[code],
    kind: "activity",
  }));
  return [...activities, ...subjectList(data)];
}

export function EntitySearch({ type, placeholder, data, onSelect }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const fullList = useMemo(() => buildList(data, type), [data, type]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? fullList.filter(i => i.label.toLowerCase().includes(q)) : fullList;
  }, [fullList, search]);

  function handleSelect(item) {
    onSelect(item.kind ?? type, item.id);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="search-input-wrap">
      <input
        className="entity-search"
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="search-results">
          {filtered.map(item => (
            <div
              key={`${item.kind}:${item.id}`}
              className="search-result-item"
              onMouseDown={() => handleSelect(item)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchBar() {
  const { state, dispatch } = useAppState();
  const data = state.timetableData;
  if (!data) return null;

  function handleSelect(type, id) {
    dispatch({ type: "SET_ACTIVE_ENTITY", payload: { type, id } });
  }

  return (
    <div className="search-bar">
      <EntitySearch type="student" placeholder="Student" data={data} onSelect={handleSelect} />
      <EntitySearch type="teacher" placeholder="Teacher" data={data} onSelect={handleSelect} />
      <EntitySearch type="subject" placeholder="Subject / Activity" data={data} onSelect={handleSelect} />
    </div>
  );
}
