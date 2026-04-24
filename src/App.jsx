import { useEffect, useMemo, useRef, useState } from "react";
import { AppProvider, useAppState } from "./store/appState";
import TopBar from "./components/TopBar";
import TimetableGrid from "./components/TimetableGrid";
import SubblockPopout from "./components/SubblockPopout";
import SearchBar from "./components/SearchBar";
import {
  buildSlotMap,
  getTeacherSlotMap,
  getStudentSlotMap,
  getSubjectSlotMap,
} from "./utils/timetableLayout";
import { validate } from "./utils/schema";
import { loadTimetable, saveTimetable } from "./utils/storage";
import "./App.css";

function getEntityLabel(data, entity) {
  if (!entity || !data) return "";
  if (entity.type === "teacher") return data.teachers[entity.id]?.name ?? entity.id;
  if (entity.type === "student") return data.students[entity.id]?.name ?? entity.id;
  return entity.id; // subject code is its own label
}

function AppShell() {
  const { state, dispatch } = useAppState();
  const data = state.timetableData;
  const activeEntity = state.activeEntity;

  const [popout, setPopout] = useState(null); // { slot, cellRect }
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadTimetable();
    if (stored) {
      const { ok } = validate(stored);
      if (ok) dispatch({ type: "LOAD_TIMETABLE", payload: stored });
    }
    hydrated.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (data) saveTimetable(data);
  }, [data]);

  const schoolSlotMap = useMemo(() => (data ? buildSlotMap(data) : {}), [data]);

  const entitySlotMap = useMemo(() => {
    if (!data || !activeEntity) return {};
    const { type, id } = activeEntity;
    if (type === "teacher") return getTeacherSlotMap(data, id);
    if (type === "student") return getStudentSlotMap(data, id);
    return getSubjectSlotMap(data, id);
  }, [data, activeEntity]);

  const currentSlotMap = activeEntity ? entitySlotMap : schoolSlotMap;
  const entityLabel = getEntityLabel(data, activeEntity);

  function handleStudentSelect(studentId) {
    dispatch({
      type: "SET_ACTIVE_ENTITY",
      payload: { type: "student", id: studentId },
    });
  }

  function handleCellClick(slot, cellRect, gridRect) {
    setPopout({ slot, cellRect, gridRect });
  }

  function handleClose() {
    dispatch({ type: "CLEAR_ACTIVE_ENTITY" });
  }

  return (
    <div id="app">
      <TopBar />
      <div id="timetable-area">
        {data && <SearchBar />}
        {data && activeEntity && (
          <div className="entity-bar">
            <span className="entity-bar-label">
              {activeEntity.type.charAt(0).toUpperCase() + activeEntity.type.slice(1)}
              {": "}
              {entityLabel}
            </span>
            <button className="entity-close-btn" onClick={handleClose}>×</button>
          </div>
        )}
        {data ? (
          <TimetableGrid
            slotMap={currentSlotMap}
            data={data}
            mode={activeEntity ? "entity" : "school"}
            entityType={activeEntity?.type}
            onCellClick={handleCellClick}
          />
        ) : (
          <p className="no-data">No timetable loaded.</p>
        )}
      </div>
      {popout && data && (
        <SubblockPopout
          slot={popout.slot}
          cellRect={popout.cellRect}
          gridRect={popout.gridRect}
          data={data}
          slotMap={currentSlotMap}
          mode={activeEntity ? "entity" : "school"}
          onStudentSelect={handleStudentSelect}
          onClose={() => setPopout(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
