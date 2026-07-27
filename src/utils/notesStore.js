// Local scratch notes attached to grid cells. Device-local only, never synced.
// Timetable content is never written here — POPIA. Only teacher-typed text.

const KEY = "timeview.cellNotes";

export const cellKey = (entity, slot) => `${entity.type}:${entity.id}|${slot}`;

export function getAllNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
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

export function setNote(key, text) {
  const notes = getAllNotes();
  const trimmed = (text ?? "").trim();
  if (trimmed) notes[key] = trimmed;
  else delete notes[key];
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
