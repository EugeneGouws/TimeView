#!/usr/bin/env python3
"""
tools/tt1_to_json.py — Stage 2 patcher
Reads timetable.json (from Stage 1) + TT1.xlsx.
Writes: teachers[x].name, teachers[x].venue, free_periods.teachers.
Produces: data/tt1_verification_report.txt

Never writes: subjects, enrolments, placements, students, free_periods.students.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

TIMETABLE_COL_RE = re.compile(r"^[A-H][1-9]$|^P[1-4]$")

TT1_FREE_CODES = {
    "BATTING": "BAT",
    "LIBRARY": "LIB",
    "MEETING": "MEETING",
}


def detect_timetable_columns(columns):
    cols = [str(c) for c in columns if TIMETABLE_COL_RE.match(str(c))]
    cols.sort(key=lambda x: (x[0], int(x[1:])))
    return cols


def build_occupied_set(data):
    """Build {(teacher_id, timeslot)} from Stage 1 placements."""
    occupied = set()
    for subj_code, subj in data["subjects"].items():
        teacher_id = subj.get("teacher")
        if not teacher_id:
            continue
        for slot in data["placements"].get(subj_code, []):
            occupied.add((teacher_id, slot))
    return occupied


def safe_str(val):
    if pd.isna(val) if not isinstance(val, str) else False:
        return None
    s = str(val).strip()
    return s if s else None


def process_tt1(st1_json_path: Path, tt1_path: Path):
    with open(st1_json_path, encoding="utf-8") as f:
        data = json.load(f)

    df = pd.read_excel(tt1_path)
    tt_cols = detect_timetable_columns(df.columns)
    if not tt_cols:
        print("ERROR: No timetable columns detected in TT1.", file=sys.stderr)
        sys.exit(1)
    print(f"Detected {len(tt_cols)} timetable columns: {tt_cols[0]} to {tt_cols[-1]}")

    occupied = build_occupied_set(data)

    # Build reverse map: surname (uppercase) → numeric teacher ID
    # teachers[id].name holds the surname from Stage 1
    surname_to_id = {
        v["name"].upper(): k
        for k, v in data["teachers"].items()
        if v.get("name")
    }

    warnings = []
    names_written = 0
    venues_written = 0
    free_slots_written = 0
    unknown_teachers = []

    fp_teachers = data["free_periods"].get("teachers", {})

    for _, row in df.iterrows():
        surname = safe_str(row.get("TSurname"))
        if not surname:
            continue

        teacher_id = surname_to_id.get(surname.upper())

        if teacher_id is None:
            unknown_teachers.append(surname.upper())
            continue

        # Write full name (title + initials + surname)
        title = safe_str(row.get("TTitle")) or ""
        initials = safe_str(row.get("TInitials")) or ""
        parts = [p for p in [title, initials, surname.upper()] if p]
        name_str = " ".join(parts)
        data["teachers"][teacher_id]["name"] = name_str
        names_written += 1

        # Write venue
        classroom = safe_str(row.get("TClassroom"))
        if classroom:
            data["teachers"][teacher_id]["venue"] = classroom
            venues_written += 1

        # Process timetable cells
        for col in tt_cols:
            cell = row.get(col)
            if not isinstance(cell, str):
                if pd.isna(cell):
                    continue
                cell = str(cell).strip()
            else:
                cell = cell.strip()

            if not cell:
                continue

            first_token = cell.split()[0].upper() if cell.split() else ""

            if first_token in TT1_FREE_CODES:
                canonical = TT1_FREE_CODES[first_token]
                fp_teachers.setdefault(teacher_id, {})[col] = canonical
                free_slots_written += 1
                if (teacher_id, col) in occupied:
                    warnings.append(
                        f"  WARN  {teacher_id} slot {col}: TT1=free({canonical}) but ST1 has class"
                    )
            else:
                if (teacher_id, col) not in occupied:
                    warnings.append(
                        f"  WARN  {teacher_id} slot {col}: TT1=class({cell!r}) but no ST1 placement"
                    )

    data["free_periods"]["teachers"] = fp_teachers
    data["source"]["tt1"] = tt1_path.name

    # Write patched JSON
    with open(st1_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Write verification report
    report_path = st1_json_path.parent / "tt1_verification_report.txt"
    total_teacher_slots = sum(
        len(data["placements"].get(s, [])) for s in data["subjects"]
    )
    aligned = total_teacher_slots - len(
        [w for w in warnings if "but ST1 has class" not in w]
    )

    lines = [
        f"TT1 Verification Report",
        f"Source : {tt1_path.name}",
        f"JSON   : {st1_json_path.name}",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        f"",
        f"Names written   : {names_written}",
        f"Venues written  : {venues_written}",
        f"Free slots      : {free_slots_written}",
        f"Warnings        : {len(warnings)}",
        f"Unknown teachers: {len(unknown_teachers)}",
        f"",
    ]
    if unknown_teachers:
        lines.append("Unknown teachers (in TT1, not in ST1):")
        for t in unknown_teachers:
            lines.append(f"  {t}")
        lines.append("")
    if warnings:
        lines.append("Warnings:")
        lines.extend(warnings)
    else:
        lines.append("No warnings.")

    report_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"Done.")
    print(f"  Names written   : {names_written}")
    print(f"  Venues written  : {venues_written}")
    print(f"  Free slots      : {free_slots_written}")
    print(f"  Warnings        : {len(warnings)}")
    print(f"  Unknown teachers: {len(unknown_teachers)}")
    print(f"  Report          : {report_path}")


def main():
    parser = argparse.ArgumentParser(
        description="TT1 Stage 2 patcher — updates timetable.json with teacher names, venues, free periods"
    )
    parser.add_argument(
        "--st1-json",
        required=True,
        help="Path to timetable.json produced by st1_to_json.py",
    )
    parser.add_argument("--input", required=True, help="Path to TT1.xlsx")
    args = parser.parse_args()

    st1_json_path = Path(args.st1_json)
    tt1_path = Path(args.input)

    if not st1_json_path.exists():
        print(f"ERROR: JSON not found: {st1_json_path}", file=sys.stderr)
        sys.exit(1)
    if not tt1_path.exists():
        print(f"ERROR: TT1 xlsx not found: {tt1_path}", file=sys.stderr)
        sys.exit(1)

    process_tt1(st1_json_path, tt1_path)


if __name__ == "__main__":
    main()
