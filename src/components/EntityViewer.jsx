import { useState, useMemo } from "react";
import { useAppState } from "../store/appState";
import {
  getTeacherSlotMap,
  getStudentSlotMap,
  getSubjectSlotMap,
  BLOCKS,
  PERIODS,
} from "../utils/timetableLayout";

const ENTITY_TYPES = ["Student", "Teacher", "Subject"];

function buildFullList(data, entityType) {
  if (entityType === "Teacher") {
    return Object.entries(data.teachers)
      .map(([id, t]) => ({ id, label: t.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  if (entityType === "Student") {
    return Object.entries(data.students)
      .map(([id, s]) => ({ id, label: s.name ? `${s.name} (${id})` : id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  // Subject — unique subject codes
  const codes = new Set(Object.values(data.subjects).map(s => s.name));
  return [...codes].sort().map(code => ({ id: code, label: code }));
}

function formatLines(data, labels, entityType) {
  return labels.map(label => {
    const subj = data.subjects[label];
    const teacherName = subj.teacher ? (data.teachers[subj.teacher]?.name ?? "") : "";
    if (entityType === "Teacher") return `${subj.name}  Gr${subj.grade}`;
    if (entityType === "Student") return `${subj.name}  ${teacherName}`;
    return `${subj.name}  ${teacherName}  Gr${subj.grade}`;
  });
}

export default function EntityViewer() {
  const { state } = useAppState();
  const data = state.timetableData;

  const [entityType, setEntityType] = useState("Student");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // { id, label }

  const fullList = useMemo(
    () => (data ? buildFullList(data, entityType) : []),
    [data, entityType]
  );

  const filteredList = useMemo(() => {
    const q = search.toLowerCase();
    return q ? fullList.filter(item => item.label.toLowerCase().includes(q)) : fullList;
  }, [fullList, search]);

  const slotMap = useMemo(() => {
    if (!data || !selected) return {};
    if (entityType === "Teacher") return getTeacherSlotMap(data, selected.id);
    if (entityType === "Student") return getStudentSlotMap(data, selected.id);
    return getSubjectSlotMap(data, selected.id);
  }, [data, selected, entityType]);

  function handleTypeChange(e) {
    setEntityType(e.target.value);
    setSearch("");
    setSelected(null);
  }

  if (!data) return null;

  return (
    <div className="entity-viewer">
      <div className="entity-controls">
        <select
          className="entity-type-select"
          value={entityType}
          onChange={handleTypeChange}
        >
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="entity-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${entityType}…`}
        />
      </div>

      <div className="entity-list">
        {filteredList.map(item => (
          <div
            key={item.id}
            className={`entity-list-item${selected?.id === item.id ? " entity-list-item--selected" : ""}`}
            onClick={() => setSelected(item)}
          >
            {item.label}
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div className="entity-heading">{entityType}: {selected.label}</div>
          <div className="entity-grid-wrap">
            <table className="timetable-grid">
              <thead>
                <tr>
                  <th className="grid-corner" />
                  {PERIODS.map(p => (
                    <th key={p} className="grid-period-header">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOCKS.map(block => (
                  <tr key={block}>
                    <td className="grid-block-label">{block}</td>
                    {PERIODS.map(period => {
                      const slot = `${block}${period}`;
                      const labels = slotMap[slot] ?? [];
                      const lines = formatLines(data, labels, entityType);
                      return (
                        <td
                          key={period}
                          className={`grid-cell ${labels.length ? "grid-cell--active" : "grid-cell--empty"}`}
                        >
                          {lines.map((line, i) => (
                            <div key={i} className="grid-subject-line">{line}</div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
