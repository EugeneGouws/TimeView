export const ACTIVITY_LABEL = {
  LIB:     "Library",
  STUDY:   "Study",
  BAT:     "Batting",
  MEETING: "Meeting",
  EXTRA:   "Extra Lesson",
  LAB:     "Lab",
  FREE:    "Free",
};

// "Soft" frees: entity is nominally free but has a duty, so they get a lighter
// highlight than a genuinely free period.
const SOFT_FREE_CODES = ["LIB", "BAT", "MEETING"];

export const isSoftFree = (code) => SOFT_FREE_CODES.includes(code);
