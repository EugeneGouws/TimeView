export const SCHEMA_VERSION = "3.0";

const REQUIRED_KEYS = [
  "version",
  "generated_at",
  "source",
  "timeslots",
  "students",
  "teachers",
  "lessons",
  "enrolments",
  "placements",
  "student_slots",
  "free_periods",
];

export function validate(json) {
  const errors = [];

  if (!json || typeof json !== "object") {
    return { ok: false, errors: ["Not a JSON object."] };
  }

  // Version check
  if (!json.version) {
    errors.push("Missing field: version.");
  } else {
    const fileMajor = String(json.version).split(".")[0];
    const schemaMajor = SCHEMA_VERSION.split(".")[0];
    if (fileMajor !== schemaMajor) {
      errors.push(
        `Version mismatch: file is ${json.version}, expected major version ${schemaMajor}.x`
      );
    }
  }

  // Required top-level keys
  for (const key of REQUIRED_KEYS) {
    if (!(key in json)) {
      errors.push(`Missing field: ${key}.`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const timeslotSet = new Set(json.timeslots);

  // Timeslot closure — placements
  for (const [code, slots] of Object.entries(json.placements)) {
    for (const slot of slots) {
      if (!timeslotSet.has(slot)) {
        errors.push(`placements[${code}]: unknown timeslot "${slot}".`);
      }
    }
  }

  // Timeslot closure — free_periods.students
  for (const [sid, slots] of Object.entries(json.free_periods.students || {})) {
    for (const slot of Object.keys(slots)) {
      if (!timeslotSet.has(slot)) {
        errors.push(`free_periods.students[${sid}]: unknown timeslot "${slot}".`);
      }
    }
  }

  // Timeslot closure — free_periods.teachers
  for (const [code, slots] of Object.entries(json.free_periods.teachers || {})) {
    for (const slot of Object.keys(slots)) {
      if (!timeslotSet.has(slot)) {
        errors.push(`free_periods.teachers[${code}]: unknown timeslot "${slot}".`);
      }
    }
  }

  // Entity closure — enrolments reference valid lessons and students
  const subjectSet = new Set(Object.keys(json.lessons));
  const studentSet = new Set(Object.keys(json.students));

  for (const [code, studentIds] of Object.entries(json.enrolments)) {
    if (!subjectSet.has(code)) {
      errors.push(`enrolments: lesson "${code}" not in lessons.`);
    }
    for (const sid of studentIds) {
      if (!studentSet.has(String(sid))) {
        errors.push(`enrolments[${code}]: student "${sid}" not in students.`);
      }
    }
  }

  // Entity closure — placements reference valid lessons
  for (const code of Object.keys(json.placements)) {
    if (!subjectSet.has(code)) {
      errors.push(`placements: lesson "${code}" not in lessons.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function versionMismatch(json) {
  if (!json?.version) return false;
  const fileMajor = String(json.version).split(".")[0];
  const schemaMajor = SCHEMA_VERSION.split(".")[0];
  return fileMajor !== schemaMajor;
}
