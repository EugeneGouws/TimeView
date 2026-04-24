/**
 * Subject code constants and multiplicity (M) values.
 * M = observed slot count per timetable cycle from ST1 2026.xlsx analysis.
 * Default M = 7. Grade-specific overrides in SUBJECT_M_GRADE.
 */

export const DEFAULT_M = 7;

/** Base M per subject code (gr 10-12 value where grades differ). */
export const SUBJECT_M = {
  AC:       7,
  AF:       7,
  BS:       7,
  CAT:      7,
  DA:       7,
  DR:       7,
  ED:       7,
  EMS:      4,
  EN:       7,
  FR:       7,
  FSE:      1,
  FSENG:    1,
  FSM:      1,
  FSS:      1,
  GE:       7,
  HI:       7,
  IT:       7,
  LO:       2,
  LS:       7,
  MA:       7,
  MANDARIN: 1,
  MANDIRIN: 1,
  ML:       7,
  MU:       7,
  OD:       4,
  ODA:      4,
  OE:       4,
  OF:       4,
  OM:       4,
  PE:       2,
  RDI:      1,
  SC:       7,
  TE:       4,
  VA:       7,
  ZU:       7,
};

/** Grade-specific M overrides: keyed as "CODE_GG" (e.g. "EN_08"). */
export const SUBJECT_M_GRADE = {
  EN_08: 8,  EN_09: 8,
  MA_10: 10, MA_11: 10, MA_12: 10,
  GE_08: 3,  GE_09: 3,
  HI_08: 3,  HI_09: 3,
  SC_08: 3,  SC_09: 3,
  LS_08: 3,  LS_09: 3,
  LO_08: 3,  LO_09: 3,
  DR_08: 1,  DR_09: 1,
  VA_08: 4,  VA_09: 4,
};

/**
 * Returns M for a subject code + grade.
 * @param {string} subjectCode  e.g. "MA"
 * @param {number|string} grade e.g. 10 or "10"
 */
export function getM(subjectCode, grade) {
  const g = String(grade).padStart(2, "0");
  const key = `${subjectCode}_${g}`;
  if (key in SUBJECT_M_GRADE) return SUBJECT_M_GRADE[key];
  return SUBJECT_M[subjectCode] ?? DEFAULT_M;
}
