export const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

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
    map[slot] = sortLabels(map[slot], data.subjects);
  }
  return map;
}

// { timeslot: [label, ...] } — one teacher
export function getTeacherSlotMap(data, teacherId) {
  const map = {};
  for (const [label, subj] of Object.entries(data.subjects)) {
    if (subj.teacher !== teacherId) continue;
    for (const slot of data.placements[label] ?? []) {
      (map[slot] ??= []).push(label);
    }
  }
  return map;
}

// { timeslot: [label] } — one student (direct per-student index)
export function getStudentSlotMap(data, studentId) {
  const slots = data.student_slots?.[studentId] ?? {};
  const map = {};
  for (const [slot, label] of Object.entries(slots)) {
    map[slot] = [label];
  }
  return map;
}

// { timeslot: [label, ...] } — all instances of a subject code
export function getSubjectSlotMap(data, subjectCode) {
  const map = {};
  for (const [label, subj] of Object.entries(data.subjects)) {
    if (subj.name !== subjectCode) continue;
    for (const slot of data.placements[label] ?? []) {
      (map[slot] ??= []).push(label);
    }
  }
  return map;
}
