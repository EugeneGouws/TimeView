// Local scratch notes attached to grid cells. Device-local only, never synced.
// Timetable content is never written here — POPIA. Only teacher-typed text.
//
// Stored shape: notes[cellKey] = { text, displayMode: "dot" | "inline" }.
// Older data (pre display-mode) stored a bare string — coerced on read.

const KEY = "timeview.cellNotes";

export const cellKey = (entity, slot) => `${entity.type}:${entity.id}|${slot}`;

export function getAllNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const notes = {};
    for (const [k, v] of Object.entries(parsed)) {
      notes[k] = typeof v === "string" ? { text: v, displayMode: "dot" } : v;
    }
    return notes;
  } catch {
    return {};
  }
}

function write(notes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    // Storage disabled or full — notes degrade to session-only.
  }
  return notes;
}

export function setNote(key, text, displayMode) {
  const notes = getAllNotes();
  const trimmed = (text ?? "").trim();
  if (trimmed) {
    notes[key] = { text: trimmed, displayMode: displayMode ?? notes[key]?.displayMode ?? "dot" };
  } else {
    delete notes[key];
  }
  return write({ ...notes });
}

export function setNoteDisplayMode(key, displayMode) {
  const notes = getAllNotes();
  if (notes[key]) notes[key] = { ...notes[key], displayMode };
  return write({ ...notes });
}

export function clearAllNotes() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return {};
}
