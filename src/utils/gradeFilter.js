// Grade / reg-class scope filter. Grades and reg-class values are read from the
// loaded JSON, so added or renamed classes need no code change.

// Grades whose reg classes are real cohorts worth filtering by. Every grade
// carries a reg_class in the data, but 10-12 are option-driven — a reg class
// there isn't a group that shares a timetable.
const REG_CLASS_GRADES = ["8", "9"];

// A grade filter id is either a grade ("8") or a reg class ("8A").
export function gradeLabel(id) {
  const grade = id.match(/^\d+/)?.[0] ?? id;
  const rest = id.slice(grade.length);
  return rest ? `Gr ${grade} ${rest}` : `Gr ${grade}`;
}

// Reg classes are compared case-insensitively — the source data carries both
// "9F" and "9f".
export function matchesGrade(student, id) {
  if (!student) return false;
  return (
    student.grade === id ||
    (student.reg_class ?? "").toUpperCase() === id.toUpperCase()
  );
}

// [{ id, label, kind }] for the grade search box: every grade, plus a per-reg-
// class breakdown for REG_CLASS_GRADES, plus an "everyone" reset.
export function gradeOptions(data) {
  const regByGrade = new Map();
  for (const s of Object.values(data.students ?? {})) {
    if (!s?.grade) continue;
    const set = regByGrade.get(s.grade) ?? new Set();
    if (s.reg_class) set.add(s.reg_class.toUpperCase());
    regByGrade.set(s.grade, set);
  }

  const out = [{ id: "ALL", label: "Everyone (all grades)", kind: "all" }];
  for (const grade of [...regByGrade.keys()].sort((a, b) => parseInt(a) - parseInt(b))) {
    const regs = [...regByGrade.get(grade)].sort();
    const breakdown = REG_CLASS_GRADES.includes(grade) && regs.length > 0;
    out.push({
      id: grade,
      label: breakdown ? `${gradeLabel(grade)} (all)` : gradeLabel(grade),
      kind: "grade",
    });
    if (breakdown) {
      for (const rc of regs) out.push({ id: rc, label: gradeLabel(rc), kind: "grade" });
    }
  }
  return out;
}
