import * as XLSX from "xlsx";
import {
  OPTION_GRADES,
  OPTION_SUBJECTS_REMAP,
  getM,
} from "./subjectsData";

const SCHEMA_VERSION = "3.0";
const TT_COL_RE = /^[A-H][1-9]$|^P[1-4]$/;
const REG_CLASS_COL_IDX = 4; // Excel column E — values like "12R", "9C"
const FREE_CODES = new Set(["FREE", "LIB", "EXTRA", "ST"]);
const FREE_MAP = { FREE: "STUDY", LIB: "LIB", EXTRA: "EXTRA", ST: "STUDY" };

function applyOptionMask(code, grade) {
  if (OPTION_GRADES.has(grade) && code in OPTION_SUBJECTS_REMAP) {
    return OPTION_SUBJECTS_REMAP[code];
  }
  return code;
}

function parseCell(raw, grade) {
  if (typeof raw !== "string") return { kind: "skip" };
  const trimmed = raw.trim();
  if (trimmed.length < 2) return { kind: "skip" };
  const tokens = trimmed.split(/\s+/);
  const rawCode = tokens[0];

  if (FREE_CODES.has(rawCode)) return { kind: "free", code: FREE_MAP[rawCode] };

  const code = applyOptionMask(rawCode, grade);
  if (tokens.length < 2) {
    const label = `${code}_${String(grade).padStart(2, "0")}`;
    return { kind: "subject", label, code, teacherSurname: null };
  }
  const teacherSurname = tokens.slice(1).join(" ");
  const label = `${code}_${teacherSurname.replace(/\s+/g, "_")}_${String(grade).padStart(2, "0")}`;
  return { kind: "subject", label, code, teacherSurname };
}

function detectTimetableColumns(headers) {
  return headers
    .filter(h => typeof h === "string" && TT_COL_RE.test(h))
    .sort((a, b) => {
      if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    });
}

export function convertXlsxToTimetable(arrayBuffer, filename = "ST1.xlsx") {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (!rows.length) throw new Error("Sheet is empty.");

  const headers = Object.keys(rows[0]);
  const regClassHeader = headers[REG_CLASS_COL_IDX] ?? null;
  const ttCols = detectTimetableColumns(headers);
  if (!ttCols.length) {
    throw new Error("No timetable columns (A1–H9, P1–P4) detected in xlsx.");
  }

  const students = {};
  const teachers = {};
  const teacherSurnameToId = {};
  let teacherIdCounter = 0;
  const subjects = {};
  const enrolments = {};
  const placements = {};
  const studentSlots = {};
  const fpStudents = {};

  for (const row of rows) {
    const sidRaw = row["Studentid"];
    const gradeRaw = row["Grade"];
    if (sidRaw == null || gradeRaw == null) continue;
    const sid = String(parseInt(sidRaw));
    const grade = parseInt(gradeRaw);
    if (Number.isNaN(grade)) continue;

    const surname = row["SSurname"];
    const firstname = row["SFirstname"];
    let name = null;
    if (surname != null && firstname != null) name = `${surname}, ${firstname}`;
    else if (surname != null) name = String(surname);

    const regRaw = regClassHeader ? row[regClassHeader] : null;
    const regClass = regRaw != null ? String(regRaw).trim() : null;
    students[sid] = { name, grade: String(grade), reg_class: regClass };

    for (const col of ttCols) {
      const cell = row[col];
      if (cell == null) continue;
      const parsed = parseCell(String(cell), grade);

      if (parsed.kind === "free") {
        (fpStudents[sid] ??= {})[col] = parsed.code;
      } else if (parsed.kind === "subject") {
        let teacherId = null;
        if (parsed.teacherSurname) {
          if (parsed.teacherSurname in teacherSurnameToId) {
            teacherId = teacherSurnameToId[parsed.teacherSurname];
          } else {
            teacherIdCounter += 1;
            teacherId = String(teacherIdCounter);
            teacherSurnameToId[parsed.teacherSurname] = teacherId;
            teachers[teacherId] = { name: parsed.teacherSurname, venue: null };
          }
        }
        if (!(parsed.label in subjects)) {
          subjects[parsed.label] = {
            name: parsed.code,
            grade: String(grade),
            teacher: teacherId,
            m: getM(parsed.code, grade),
          };
        }
        (enrolments[parsed.label] ??= []);
        if (!enrolments[parsed.label].includes(sid)) {
          enrolments[parsed.label].push(sid);
        }
        (placements[parsed.label] ??= []);
        if (!placements[parsed.label].includes(col)) {
          placements[parsed.label].push(col);
        }
        (studentSlots[sid] ??= {})[col] = parsed.label;
      }
    }
  }

  return {
    version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    source: { st1: filename, tt1: null },
    timeslots: ttCols,
    students,
    teachers,
    lessons: subjects,
    enrolments,
    placements,
    student_slots: studentSlots,
    free_periods: { students: fpStudents, teachers: {} },
  };
}
