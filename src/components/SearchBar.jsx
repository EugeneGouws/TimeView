import { useState, useMemo } from "react";
import { useAppState } from "../store/appState";
import { subjectDisplay } from "../utils/subjectNames";
import { ACTIVITY_LABEL } from "../utils/activityLabels";

const ACTIVITY_CODES = ["LIB", "STUDY", "BAT", "MEETING"];

function buildList(data, type) {
  if (type === "teacher") {
    return Object.entries(data.teachers)
      .map(([id, t]) => ({ id, label: t.display_name ?? t.surname ?? id, kind: "teacher" }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  if (type === "student") {
    return Object.entries(data.students)
      .map(([id, s]) => ({ id, label: s.name ? `${s.name} (${id})` : id, kind: "student" }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  const codes = new Set(Object.values(data.subjects).map(s => s.name));
  const subjects = [...codes]
    .map(code => ({ id: code, label: `${subjectDisplay(code)} (${code})`, kind: "subject" }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const activities = ACTIVITY_CODES.map(code => ({
    id: code,
    label: code === "STUDY" ? "Study / Free" : ACTIVITY_LABEL[code],
    kind: "activity",
  }));
  return [...activities, ...subjects];
}

function EntitySearch({ type, placeholder, data, onSelect }) {
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
              key={item.id}
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
