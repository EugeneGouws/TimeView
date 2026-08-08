import { useEffect, useMemo, useRef, useState } from "react";
import { AppProvider, useAppState } from "./store/appState";
import TopBar from "./components/TopBar";
import TimetableGrid from "./components/TimetableGrid";
import TimetableHeader from "./components/TimetableHeader";
import TimesGrid from "./components/TimesGrid";
import SubblockPopout from "./components/SubblockPopout";
import SearchBar, { EntitySearch } from "./components/SearchBar";
import NotePopout from "./components/NotePopout";
import { cellKey, getAllNotes, setNote } from "./utils/notesStore";
import { cellDetails, buildRosterIndex } from "./utils/cellDetails";
import { buildSlotMap, slotMapFor } from "./utils/timetableLayout";
import { validate } from "./utils/schema";
import { getHandle, clearHandle } from "./utils/fileHandleStore";
import { getLastEntity, setLastEntity } from "./utils/lastEntityStore";
import { ACTIVITY_LABEL } from "./utils/activityLabels";
import { gradeLabel } from "./utils/gradeFilter";
import "./App.css";

const MAX_COMPARE = 3;

function getEntityLabel(data, entity) {
  if (!entity || !data) return "";
  if (entity.type === "teacher") {
    const t = data.teachers[entity.id];
    return t?.display_name ?? t?.surname ?? entity.id;
  }
  if (entity.type === "student") return data.students[entity.id]?.name ?? entity.id;
  if (entity.type === "grade") return gradeLabel(entity.id);
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
  const [notes, setNotes] = useState(() => getAllNotes());
  const [expandAll, setExpandAll] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [noteSlot, setNoteSlot] = useState(null); // slot whose note editor is open
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

    const last = getLastEntity();
    if (last && Object.keys(slotMapFor(parsed, last)).length > 0) {
      dispatch({ type: "SET_ACTIVE_ENTITY", payload: last });
    }
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

  useEffect(() => {
    if (!data) return; // don't clobber the stored ref before the timetable has loaded
    setLastEntity(activeEntity);
  }, [data, activeEntity]);

  const schoolSlotMap = useMemo(() => (data ? buildSlotMap(data) : {}), [data]);

  // Only the expanded grid needs rosters — don't pay for the index otherwise.
  const rosterIndex = useMemo(
    () => (data && expandAll ? buildRosterIndex(data) : null),
    [data, expandAll]
  );

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

  // Lesson times are only meaningful on a plain personal timetable.
  const showTimesOnPrint =
    !overlayMode &&
    (activeEntity?.type === "teacher" || activeEntity?.type === "student");

  function handleStudentSelect(studentId) {
    dispatch({
      type: "SET_ACTIVE_ENTITY",
      payload: { type: "student", id: studentId },
    });
  }

  // Notes attach to the primary entity, so they need exactly one selected.
  const notesEnabled = Boolean(activeEntity) && !overlayMode;

  // Dot markers — every noted slot regardless of display mode (selection/marker use).
  const notedSlots = useMemo(() => {
    if (!activeEntity) return new Set();
    const prefix = `${activeEntity.type}:${activeEntity.id}|`;
    return new Set(
      Object.keys(notes).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length))
    );
  }, [notes, activeEntity]);

  // Inline-mode notes render their text in the cell instead of just a dot.
  const inlineNoteText = useMemo(() => {
    const map = new Map();
    if (!activeEntity) return map;
    const prefix = `${activeEntity.type}:${activeEntity.id}|`;
    for (const [k, v] of Object.entries(notes)) {
      if (k.startsWith(prefix) && v?.displayMode === "inline" && v.text) {
        map.set(k.slice(prefix.length), v.text);
      }
    }
    return map;
  }, [notes, activeEntity]);

  // Reset note UI when the entity changes (adjust-state-during-render pattern).
  const entityKey = activeEntity ? `${activeEntity.type}:${activeEntity.id}` : "";
  const [prevEntityKey, setPrevEntityKey] = useState(entityKey);
  if (prevEntityKey !== entityKey) {
    setPrevEntityKey(entityKey);
    setSelectedSlot(null);
    setNoteSlot(null);
  }

  // Reached from the cell panel's pen — every cell type opens that panel.
  function openNoteEditor(slot) {
    setPopout(null);
    setNoteSlot(slot);
  }

  function handleSaveNote(text, displayMode) {
    setNotes(setNote(cellKey(activeEntity, noteSlot), text, displayMode));
    setNoteSlot(null);
  }

  function handleCellClick(slot, cellRect, gridRect) {
    setSelectedSlot(slot);
    setPopout({ slot, cellRect, gridRect });
  }

  function handleClose() {
    dispatch({ type: "CLOSE_ACTIVE_ENTITY" });
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
    <div id="app" className={showTimesOnPrint ? "" : "print-no-times"}>
      <TopBar canPrint={!!data} />
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
                  title={i === 0 && compareEntities.length === 0 ? "Clear" : "Remove"}
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
              notedSlots={notedSlots}
              noteTextMap={inlineNoteText}
              selectedSlot={selectedSlot}
              expandAll={expandAll}
              rosterIndex={rosterIndex}
              onToggleExpandAll={() => setExpandAll(v => !v)}
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
          onOpenNote={notesEnabled ? () => openNoteEditor(popout.slot) : undefined}
          onClose={() => setPopout(null)}
        />
      )}
      {noteSlot && activeEntity && (
        <NotePopout
          slot={noteSlot}
          title={getEntityLabel(data, activeEntity)}
          details={cellDetails(data, currentSlotMap, noteSlot, "entity", activeEntity)}
          initialText={notes[cellKey(activeEntity, noteSlot)]?.text ?? ""}
          initialDisplayMode={notes[cellKey(activeEntity, noteSlot)]?.displayMode ?? "dot"}
          onSave={handleSaveNote}
          onClose={() => setNoteSlot(null)}
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
