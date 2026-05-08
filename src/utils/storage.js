const KEY = "timeview.timetable.v3";

export function saveTimetable(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("saveTimetable failed:", e);
  }
}

export function loadTimetable() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadTimetable failed:", e);
    return null;
  }
}

export function clearTimetable() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn("clearTimetable failed:", e);
  }
}
