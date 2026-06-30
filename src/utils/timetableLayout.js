export const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// Rotation: rows = Day 1..8, columns = Period 1..7. Cells = subblock label.
// Mirrors E:\TimePyBling\ui\constants.py TIMETABLE_GRID.
export const TIMETABLE_GRID = [
  ["A1", "G2", "F3", "E4", "D5", "C6", "B7"],
  ["B1", "H2", "G3", "F4", "E5", "D6", "C7"],
  ["C1", "A2", "H3", "G4", "F5", "E6", "D7"],
  ["D1", "B2", "A3", "H4", "G5", "F6", "E7"],
  ["E1", "C2", "B3", "A4", "H5", "G6", "F7"],
  ["F1", "D2", "C3", "B4", "A5", "H6", "G7"],
  ["G1", "E2", "D3", "C4", "B5", "A6", "H7"],
  ["H1", "F2", "E3", "D4", "C5", "B6", "A7"],
];

function sortLabels(labels, subjects) {
  return [...labels].sort((a, b) => {
    const sa = subjects[a], sb = subjects[b];
    const gd = parseInt(sa.grade) - parseInt(sb.grade);
    return gd !== 0 ? gd : sa.name.localeCompare(sb.name);
  });
}

// { timeslot: [label, ...] } — all subjects, school-wide
export function buildSlotMap(data) {
  const map = {};
  for (const [label, slots] of Object.entries(data.placements)) {
    for (const slot of slots) {
      (map[slot] ??= []).push(label);
    }
  }
  for (const slot of Object.keys(map)) {
    map[slot] = sortLabels(map[slot], data.lessons);
  }
  return map;
}

// { timeslot: [label, ...] } — one teacher
export function getTeacherSlotMap(data, teacherId) {
  const map = {};
  for (const [label, subj] of Object.entries(data.lessons)) {
    if (subj.teacher !== teacherId) continue;
    for (const slot of data.placements[label] ?? []) {
      (map[slot] ??= []).push(label);
    }
  }
  return map;
}

// { timeslot: [label] } — one student
export function getStudentSlotMap(data, studentId) {
  const slots = data.student_slots?.[studentId] ?? {};
  const map = {};
  for (const [slot, label] of Object.entries(slots)) {
    map[slot] = [label];
  }
  return map;
}

// { timeslot: [entityId, ...] } — all students/teachers assigned a given
// free-activity code in that slot. Entity IDs are prefixed `s:` or `t:` so
// downstream callers can distinguish.
export function getActivitySlotMap(data, code) {
  const map = {};
  function add(slot, key) {
    (map[slot] ??= []).push(key);
  }
  const base = data?.free_periods ?? { students: {}, teachers: {} };
  // STUDY merges student STUDY + teacher FREE into one view
  const teacherCode = code === "STUDY" ? "FREE" : code;
  for (const [sid, slots] of Object.entries(base.students ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === code) add(slot, `s:${sid}`);
  }
  for (const [tid, slots] of Object.entries(base.teachers ?? {})) {
    for (const [slot, c] of Object.entries(slots)) if (c === teacherCode) add(slot, `t:${tid}`);
  }
  for (const slot of Object.keys(map)) {
    map[slot] = Array.from(new Set(map[slot]));
  }
  return map;
}

// { timeslot: [label, ...] } — all instances of a subject code
export function getSubjectSlotMap(data, subjectCode) {
  const map = {};
  for (const [label, subj] of Object.entries(data.lessons)) {
    if (subj.name !== subjectCode) continue;
    for (const slot of data.placements[label] ?? []) {
      (map[slot] ??= []).push(label);
    }
  }
  return map;
}
