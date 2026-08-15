// Schema 3.1 optional keys: `school.name` and `reg_classes`. Files predating
// 3.1 carry neither, so every read here falls back rather than throwing.
// TimeEditor-written rollover drafts strip both keys even when fresh, so treat
// them as absent-capable regardless of version.

// Kept so a 3.0 file still renders the header it always did.
const SCHOOL_NAME_FALLBACK = "Crawford International";

export function schoolName(data) {
  return data?.school?.name ?? SCHOOL_NAME_FALLBACK;
}

// `reg_classes[*].teacher` is an ID and is null when that teacher has no
// lessons — display_name is the field to render.
export function regTeacherName(data, regClass) {
  if (!regClass) return null;
  return data?.reg_classes?.[regClass.trim().toUpperCase()]?.display_name ?? null;
}
