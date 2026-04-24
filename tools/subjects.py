"""
tools/subjects.py — Subject code constants and multiplicity values.
Derived from ST12026.xlsx (clean data, 2026-04-21).

M = slots per student per timetable cycle (observed mode across enrolled students).
DEFAULT_M = 7. Grade-specific overrides in SUBJECT_M_GRADE.

Option subjects in gr 8-9 are remapped to O* codes by the mask in st1_to_json.py.
"""

DEFAULT_M: int = 7

# Per-subject-code base M (gr 10-12 value, or only-grade value for single-grade subjects).
SUBJECT_M: dict[str, int] = {
    "AC":       7,
    "AF":       7,
    "BS":       7,
    "CAT":      7,
    "DA":       7,   # gr 10-12 only
    "DR":       7,   # gr 10-12 M=7; gr 8 M=4 (see override)
    "ED":       7,   # gr 10-12 only
    "EMS":      4,   # gr 8-9 only
    "EN":       7,   # gr 10-12 M=7; gr 8-9 M=8 (see override)
    "FR":       7,   # gr 10-12
    "FSE":      1,
    "FSM":      1,
    "FSS":      1,
    "GE":       7,   # gr 10-12 M=7; gr 8-9 M=3 (see override)
    "HI":       7,   # gr 10-12 M=7; gr 8-9 M=3 (see override)
    "IT":       7,
    "LO":       2,   # all grades (M=3 gr 8-9, M=2 gr 10-12)
    "LS":       7,   # gr 10-12 M=7; gr 8-9 M=3 (see override)
    "MA":       7,   # gr 8-9 M=7; gr 10-12 M=10 (see override)
    "MANDARIN": 1,
    "ML":       7,
    "MU":       7,   # gr 10-12 only; gr 8-9 → OM
    "OA":       4,   # gr 8-9 only (option subject, distinct from DR/OD/VA)
    "OD":       4,   # gr 9 only (option subject, distinct from DR/OA/VA)
    "ODA":      4,   # DA in gr 8-9 (post-remap)
    "OE":       4,   # ED in gr 8-9 (post-remap)
    "OF":       4,   # FR in gr 8-9 (post-remap)
    "OM":       4,   # MU in gr 8-9 (post-remap)
    "PE":       2,   # all grades
    "RDI":      1,   # gr 8-9 only
    "S":        7,   # single-student anomaly — default
    "SC":       7,   # gr 10-12 M=7; gr 8-9 M=3 (see override)
    "TE":       4,   # gr 8-9 only
    "V":        7,   # single-student anomaly — default
    "VA":       7,   # gr 10-12 only
    "ZU":       7,
}

# Grade-specific overrides: (subject_code, grade) → M
SUBJECT_M_GRADE: dict[tuple[str, int], int] = {
    ("EN",  8): 8,  ("EN",  9): 8,
    ("MA", 10): 10, ("MA", 11): 10, ("MA", 12): 10,
    ("GE",  8): 3,  ("GE",  9): 3,
    ("HI",  8): 3,  ("HI",  9): 3,
    ("SC",  8): 3,  ("SC",  9): 3,
    ("LS",  8): 3,  ("LS",  9): 3,
    ("LO",  8): 3,  ("LO",  9): 3,
    ("DR",  8): 4,
}


def get_m(subject_code: str, grade: int) -> int:
    override = SUBJECT_M_GRADE.get((subject_code, grade))
    if override is not None:
        return override
    return SUBJECT_M.get(subject_code, DEFAULT_M)


# Option subject remapping for gr 8-9.
# Original code renamed to O* variant; subject label uses new code.
OPTION_GRADES: frozenset[int] = frozenset({8, 9})

OPTION_SUBJECTS_REMAP: dict[str, str] = {
    "MU": "OM",
    "DA": "ODA",
    "ED": "OE",
    "FR": "OF",
    "DR": "OD",
}
