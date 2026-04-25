#!/usr/bin/env python3
"""
tools/st1_to_json.py — Stage 1 converter
Reads ST1.xlsx, outputs timetable.json conforming to schema v2.0.

Teachers are keyed by sequential integer ID (string "1", "2", ...).
Surname from ST1 cell becomes teachers[id].name.
Subject label format: SUBJECTCODE_TEACHERSURNAME_GG (human-readable key).
subjects[x].teacher = numeric teacher ID.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from subjects import OPTION_GRADES, OPTION_SUBJECTS_REMAP, get_m

SCHEMA_VERSION = "2.0"

TIMETABLE_COL_RE = re.compile(r"^[A-H][1-9]$|^P[1-4]$")

REG_CLASS_COL_IDX = 4  # Excel column E — values like "12R", "9C"

FREE_PERIOD_CODES = {"FREE", "LIB", "EXTRA", "ST"}
FREE_PERIOD_MAP = {"FREE": "STUDY", "LIB": "LIB", "EXTRA": "EXTRA", "ST": "STUDY"}


def detect_timetable_columns(columns):
    cols = [str(c) for c in columns if TIMETABLE_COL_RE.match(str(c))]
    cols.sort(key=lambda x: (x[0], int(x[1:])))
    return cols


def apply_option_mask(subject_code: str, grade: int) -> str:
    if grade in OPTION_GRADES and subject_code in OPTION_SUBJECTS_REMAP:
        return OPTION_SUBJECTS_REMAP[subject_code]
    return subject_code


def parse_cell(raw, grade):
    """
    Returns ("free", canonical_code) | ("subject", (label, subj_code, teacher_surname)) | ("skip", None)
    """
    if not isinstance(raw, str):
        return "skip", None
    tokens = raw.strip().split()
    if not tokens or len(raw.strip()) < 2:
        return "skip", None

    raw_code = tokens[0]

    if raw_code in FREE_PERIOD_CODES:
        return "free", FREE_PERIOD_MAP[raw_code]

    subject_code = apply_option_mask(raw_code, grade)

    if len(tokens) < 2:
        label = f"{subject_code}_{grade:02d}"
        return "subject", (label, subject_code, None)

    teacher_surname = " ".join(tokens[1:])
    label = f"{subject_code}_{teacher_surname.replace(' ', '_')}_{grade:02d}"
    return "subject", (label, subject_code, teacher_surname)


def build_timetable_json(input_path: Path, output_path: Path):
    df = pd.read_excel(input_path)

    tt_cols = detect_timetable_columns(df.columns)
    if not tt_cols:
        print("ERROR: No timetable columns detected.", file=sys.stderr)
        sys.exit(1)
    print(f"Detected {len(tt_cols)} timetable columns: {tt_cols[0]} to {tt_cols[-1]}")

    df = df.dropna(subset=["Studentid"])
    df["Studentid"] = df["Studentid"].astype(float).astype(int)

    students = {}
    teachers = {}                  # id → {name, venue}
    teacher_surname_to_id = {}     # surname → id (lookup during parse)
    teacher_id_counter = 0
    subjects = {}
    enrolments = {}
    placements = {}
    fp_students = {}
    student_slots = {}             # sid → { col: label }

    for _, row in df.iterrows():
        grade_raw = row.get("Grade")
        if pd.isna(grade_raw):
            continue
        grade = int(grade_raw)
        sid = str(int(row["Studentid"]))

        surname = row.get("SSurname")
        firstname = row.get("SFirstname")
        if pd.notna(surname) and pd.notna(firstname):
            name = f"{surname}, {firstname}"
        elif pd.notna(surname):
            name = str(surname)
        else:
            name = None

        reg_raw = row.iloc[REG_CLASS_COL_IDX] if REG_CLASS_COL_IDX < len(row) else None
        reg_class = str(reg_raw).strip() if pd.notna(reg_raw) else None
        students[sid] = {"name": name, "grade": str(grade), "reg_class": reg_class}

        for col in tt_cols:
            cell = row.get(col)
            if not isinstance(cell, str) and pd.isna(cell):
                continue

            cell_type, data = parse_cell(cell, grade)

            if cell_type == "free":
                fp_students.setdefault(sid, {})[col] = data

            elif cell_type == "subject":
                label, subj_code, teacher_surname = data

                # Assign numeric ID to teacher on first encounter
                teacher_id = None
                if teacher_surname:
                    if teacher_surname not in teacher_surname_to_id:
                        teacher_id_counter += 1
                        teacher_id = str(teacher_id_counter)
                        teacher_surname_to_id[teacher_surname] = teacher_id
                        teachers[teacher_id] = {"name": teacher_surname, "venue": None}
                    else:
                        teacher_id = teacher_surname_to_id[teacher_surname]

                if label not in subjects:
                    subjects[label] = {
                        "name": subj_code,
                        "grade": str(grade),
                        "teacher": teacher_id,
                        "m": get_m(subj_code, grade),
                    }

                enrolments.setdefault(label, [])
                if sid not in enrolments[label]:
                    enrolments[label].append(sid)

                placements.setdefault(label, [])
                if col not in placements[label]:
                    placements[label].append(col)

                student_slots.setdefault(sid, {})[col] = label

    output = {
        "version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {"st1": input_path.name, "tt1": None},
        "timeslots": tt_cols,
        "students": students,
        "teachers": teachers,
        "subjects": subjects,
        "enrolments": enrolments,
        "placements": placements,
        "student_slots": student_slots,
        "free_periods": {
            "students": fp_students,
            "teachers": {},
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Done.")
    print(f"  Students  : {len(students)}")
    print(f"  Teachers  : {len(teachers)}")
    print(f"  Subjects  : {len(subjects)}")
    print(f"  Output    : {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert ST1.xlsx to timetable.json (schema v2.0, Stage 1)"
    )
    parser.add_argument("--input", required=True, help="Path to ST1.xlsx")
    parser.add_argument(
        "--output", default="data/timetable.json", help="Output JSON path"
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    build_timetable_json(input_path, output_path)


if __name__ == "__main__":
    main()
