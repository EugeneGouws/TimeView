import { useEffect, useMemo, useRef, useState } from "react";
import { AppProvider, useAppState } from "./store/appState";
import TopBar from "./components/TopBar";
import TimetableGrid from "./components/TimetableGrid";
import TimetableHeader from "./components/TimetableHeader";
import TimesGrid from "./components/TimesGrid";
import SubblockPopout from "./components/SubblockPopout";
import SearchBar, { EntitySearch } from "./components/SearchBar";
import { buildSlotMap, slotMapFor } from "./utils/timetableLayout";
import { validate } from "./utils/schema";
import { getHandle, clearHandle } from "./utils/fileHandleStore";
import { ACTIVITY_LABEL } from "./utils/activityLabels";
import "./App.css";

const MAX_COMPARE = 3;

function getEntityLabel(data, entity) {
  if (!entity || !data) return "";
  if (entity.type === "teacher") {
    const t = data.teachers[entity.id];
    return t?.display_name ?? t?.surname ?? entity.id;
  }
  if (entity.type === "student") return data.students[entity.id]?.name ?? entity.id;
  if (entity.type === "activity") {
    if (entity.id === "STUDY") return "Study / Free";
    return ACTIVITY_LABEL[entity.id] ?? entity.id;
  }
  return entity.id; // subject code is its own label
}

function AppShell() {
  const { state, dispatch } = useAppState();
  const data = state.timetableData;
  const activeEntity = state.activeEntity;
  const compareEntities = state.compareEntities;

  const [popout, setPopout] = useState(null); // { slot, cellRect }
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [addingCompare, setAddingCompare] = useState(false);
  const handleRef = useRef(null);

  async function readHandle(handle) {
    const file = await handle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    const { ok, errors } = validate(parsed);
    if (!ok) throw new Error(errors.join(" "));
    dispatch({ type: "LOAD_TIMETABLE", payload: parsed });
    setNeedsReconnect(false);
    setLoadError(null);
  }

  useEffect(() => {
    (async () => {
      const handle = await getHandle();
      if (!handle) return;
      handleRef.current = handle;
      try {
        const perm = await handle.queryPermission({ mode: "read" });
        if (perm !== "granted") {
          setNeedsReconnect(true);
          return;
        }
        await readHandle(handle);
      } catch (e) {
        console.warn("timetable auto-load failed:", e);
        await clearHandle();
        handleRef.current = null;
        setLoadError("Couldn't load the saved timetable file. Please locate it again.");
      }
    })();
  }, [dispatch]);

  async function handleReconnect() {
    const handle = handleRef.current;
    if (!handle) return;
    try {
      const perm = await handle.requestPermission({ mode: "read" });
      if (perm !== "granted") return;
      await readHandle(handle);
    } catch (e) {
      console.warn("reconnect failed:", e);
      await clearHandle();
      handleRef.current = null;
      setNeedsReconnect(false);
      setLoadError("Couldn't load the saved timetable file. Please locate it again.");
    }
  }

  const schoolSlotMap = useMemo(() => (data ? buildSlotMap(data) : {}), [data]);

  const entitySlotMap = useMemo(
    () => slotMapFor(data, activeEntity),
    [data, activeEntity]
  );

  // Primary + comparison entities, each with its own colour index and slot map.
  const overlaySources = useMemo(() => {
    if (!data || !activeEntity) return [];
    return [activeEntity, ...compareEntities].map((entity, i) => ({
      entity,
      colorIdx: i,
      label: getEntityLabel(data, entity),
      slotMap: i === 0 ? entitySlotMap : slotMapFor(data, entity),
    }));
  }, [data, activeEntity, compareEntities, entitySlotMap]);

  const overlayMode = overlaySources.length >= 2;
  const currentSlotMap = activeEntity ? entitySlotMap : schoolSlotMap;
  const canCompare = activeEntity && activeEntity.type !== "activity";

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
    setAddingCompare(false);
  }

  function handleAddCompare(type, id) {
    dispatch({ type: "ADD_COMPARE_ENTITY", payload: { type, id } });
    setAddingCompare(false);
  }

  function handleRemoveCompare(entity) {
    dispatch({ type: "REMOVE_COMPARE_ENTITY", payload: entity });
  }

  return (
    <div id="app">
      <TopBar />
      <div id="timetable-area">
        {data && <SearchBar />}
        {data && activeEntity && (
          <div className="entity-bar">
            {overlaySources.map((src, i) => (
              <span key={`${src.entity.type}:${src.entity.id}`} className="entity-chip">
                <span className={`entity-chip-swatch entity-chip-swatch--c${src.colorIdx}`} />
                <span className="entity-chip-label">
                  {src.entity.type.charAt(0).toUpperCase() + src.entity.type.slice(1)}
                  {": "}
                  {src.label}
                </span>
                <button
                  className="entity-chip-close"
                  onClick={() => (i === 0 ? handleClose() : handleRemoveCompare(src.entity))}
                  title={i === 0 ? "Clear" : "Remove from comparison"}
                >
                  ×
                </button>
              </span>
            ))}
            {canCompare && compareEntities.length < MAX_COMPARE && (
              addingCompare ? (
                <div className="entity-compare-search">
                  <EntitySearch
                    type="compare"
                    placeholder="Add teacher / student / subject…"
                    data={data}
                    onSelect={handleAddCompare}
                  />
                  <button className="entity-compare-cancel" onClick={() => setAddingCompare(false)}>×</button>
                </div>
              ) : (
                <button className="entity-compare-add" onClick={() => setAddingCompare(true)}>
                  + Compare
                </button>
              )
            )}
          </div>
        )}
        {data ? (
          <>
            <TimetableHeader data={data} activeEntity={activeEntity} />
            <TimetableGrid
              slotMap={currentSlotMap}
              data={data}
              activeEntity={activeEntity}
              mode={activeEntity ? "entity" : "school"}
              entityType={activeEntity?.type}
              overlaySources={overlayMode ? overlaySources : null}
              onCellClick={handleCellClick}
            />
            <TimesGrid />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-monogram">TW</div>
            <p className="empty-state-heading">TimeView</p>
            {needsReconnect ? (
              <>
                <p className="empty-state-sub">Reconnect to the saved timetable file to continue</p>
                <button className="upload-btn" onClick={handleReconnect}>Reconnect timetable</button>
              </>
            ) : (
              <p className="empty-state-sub">
                {loadError ?? "Upload a verified timetable to get started"}
              </p>
            )}
          </div>
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
          activeEntity={activeEntity}
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
