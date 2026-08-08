import { subjectDisplay } from "./subjectNames";
import { ACTIVITY_LABEL } from "./activityLabels";

export function rosterAtSlot(data, label, slot) {
  const ss = data.student_slots ?? {};
  const out = [];
  for (const [sid, slots] of Object.entries(ss)) {
    if (slots[slot] === label) {
      out.push({ sid, name: data.students[sid]?.name ?? sid });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// { slot: { label: [name, ...] } } — every roster in one pass. The grid's
// expanded view needs a roster per lesson per cell; rosterAtSlot rescans every
// student on each call, which is ~1700 full scans for a school-wide grid.
export function buildRosterIndex(data) {
  const index = {};
  for (const [sid, slots] of Object.entries(data.student_slots ?? {})) {
    const name = data.students[sid]?.name ?? sid;
    for (const [slot, label] of Object.entries(slots)) {
      ((index[slot] ??= {})[label] ??= []).push(name);
    }
  }
  for (const bySlot of Object.values(index)) {
    for (const names of Object.values(bySlot)) names.sort((a, b) => a.localeCompare(b));
  }
  return index;
}

// Read-only summary of what a cell holds, for display alongside its note.
// Mirrors SubblockPopout's three modes without any of its interactivity.
export function cellDetails(data, slotMap, slot, mode, activeEntity) {
  const labels = slotMap?.[slot] ?? [];

  if (mode === "entity" && activeEntity?.type === "activity") {
    const items = labels.map(key => {
      const id = key.slice(2);
      if (key.startsWith("t:")) {
        const t = data.teachers[id];
        return { primary: t ? (t.display_name ?? t.surname ?? id) : id, secondary: "Teacher" };
      }
      return { primary: data.students[id]?.name ?? id, secondary: "" };
    });
    items.sort((a, b) => a.primary.localeCompare(b.primary));
    return { items };
  }

  // Nothing timetabled: report the free-period activity so the note still has
  // context ("Library", "Free", …).
  if (labels.length === 0) {
    const type = activeEntity?.type;
    if (type === "student" || type === "teacher") {
      const bucket = type === "student" ? data.free_periods?.students : data.free_periods?.teachers;
      const code = bucket?.[activeEntity.id]?.[slot];
      return { items: [{ primary: code ? (ACTIVITY_LABEL[code] ?? code) : "Free", secondary: "" }] };
    }
    return { items: [] };
  }

  return {
    items: labels.map(label => {
      const subj = data.lessons[label];
      if (!subj) return { primary: label, secondary: "" };
      const t = subj.teacher ? data.teachers[subj.teacher] : null;
      const roster = rosterAtSlot(data, label, slot);
      return {
        primary: `${subjectDisplay(subj.name)} Gr${subj.grade}`,
        secondary: t ? (t.display_name ?? t.surname ?? "") : "",
        count: roster.length,
        students: roster.map(r => r.name),
      };
    }),
  };
}
