export const DEFAULT_M = 7;

export const SUBJECT_M = {
  AC: 7, AF: 7, BS: 7, CAT: 7, DA: 7, DR: 7, ED: 7, EMS: 4, EN: 7, FR: 7,
  FSE: 1, FSM: 1, FSS: 1, GE: 7, HI: 7, IT: 7, LO: 2, LS: 7, MA: 7,
  MANDARIN: 1, ML: 7, MU: 7, OA: 4, OD: 4, ODA: 4, OE: 4, OF: 4, OM: 4,
  PE: 2, RDI: 1, S: 7, SC: 7, TE: 4, V: 7, VA: 7, ZU: 7,
};

export const SUBJECT_M_GRADE = {
  "EN|8": 8, "EN|9": 8,
  "MA|10": 10, "MA|11": 10, "MA|12": 10,
  "GE|8": 3, "GE|9": 3,
  "HI|8": 3, "HI|9": 3,
  "SC|8": 3, "SC|9": 3,
  "LS|8": 3, "LS|9": 3,
  "LO|8": 3, "LO|9": 3,
  "DR|8": 4,
};

export const OPTION_GRADES = new Set([8, 9]);

export const OPTION_SUBJECTS_REMAP = {
  MU: "OM", DA: "ODA", ED: "OE", FR: "OF", DR: "OD",
};

export function getM(code, grade) {
  const key = `${code}|${grade}`;
  if (key in SUBJECT_M_GRADE) return SUBJECT_M_GRADE[key];
  return SUBJECT_M[code] ?? DEFAULT_M;
}
