const KEY = "timeview.overlay.v1";

export const EMPTY_OVERLAY = { version: "1.0", students: {}, teachers: {} };

export const ACTIVITY_LABEL = {
  LIB: "LIBRARY",
  STUDY: "STUDY",
  BAT: "BATTING",
  MEETING: "MEETING",
};

export function loadOverlay() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_OVERLAY;
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? "1.0",
      students: parsed.students ?? {},
      teachers: parsed.teachers ?? {},
    };
  } catch (e) {
    console.warn("loadOverlay failed:", e);
    return EMPTY_OVERLAY;
  }
}

export function saveOverlay(overlay) {
  try {
    localStorage.setItem(KEY, JSON.stringify(overlay));
  } catch (e) {
    console.warn("saveOverlay failed:", e);
  }
}

function bucket(entityType) {
  return entityType === "teacher" ? "teachers" : "students";
}

export function getFreeSlot(overlay, entityType, id, slot) {
  return overlay?.[bucket(entityType)]?.[id]?.[slot] ?? null;
}

// Combine base free_periods from timetable with overlay additions.
// Overlay wins on conflict.
export function mergedFreeSlot(data, overlay, entityType, id, slot) {
  const base = data?.free_periods?.[bucket(entityType)]?.[id]?.[slot] ?? null;
  const over = getFreeSlot(overlay, entityType, id, slot);
  return over ?? base;
}

// { slot: { students: [id], teachers: [id] } } for a given activity code.
// Includes base + overlay entries.
export function indexByActivity(data, overlay, code) {
  const map = {};
  function push(slot, kind, id) {
    if (!map[slot]) map[slot] = { students: [], teachers: [] };
    if (!map[slot][kind].includes(id)) map[slot][kind].push(id);
  }
  const base = data?.free_periods ?? { students: {}, teachers: {} };
  for (const [sid, slots] of Object.entries(base.students ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === code) push(slot, "students", sid);
  }
  for (const [tid, slots] of Object.entries(base.teachers ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === code) push(slot, "teachers", tid);
  }
  for (const [sid, slots] of Object.entries(overlay?.students ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === code) push(slot, "students", sid);
  }
  for (const [tid, slots] of Object.entries(overlay?.teachers ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === code) push(slot, "teachers", tid);
  }
  return map;
}
