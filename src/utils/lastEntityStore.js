// Remembers which entity was on screen so TimeView reopens to the same place.
// Stores only a {type,id} ref, never timetable content — POPIA.

const KEY = "timeview.lastEntity";

export function getLastEntity() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.type !== "string" || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setLastEntity(entity) {
  try {
    if (entity) localStorage.setItem(KEY, JSON.stringify(entity));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage disabled or full — restore degrades to session-only.
  }
}
