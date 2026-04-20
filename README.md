# TimeView

Visual timetable explorer for South African schools.

Upload your school's `timetable.json` and browse the full timetable by teacher, student, or subject — no server, no login, no data leaving your machine.

---

## What it does

- Renders a school-wide timetable from a single JSON file
- Search by student, teacher, or subject
- Cascade menu: browse teachers → drill into class lists
- Switch views: see any teacher's, student's, or subject's full timetable
- Data lives in your browser only — nothing is sent anywhere

## How to use

**Step 1 — Export your timetable**
Run the exporter (requires Python 3.10+):
cd tools
python timetable_export.py "ST1 2026.xlsx"
This produces `timetable.json`.

**Step 2 — Run TimeView**
npm install
npm run dev
Open http://localhost:5173 and upload your `timetable.json`.

Or open `dist/index.html` directly after `npm run build`.

## Stack
- React + Vite
- Plain CSS
- No backend, no database, no accounts

## Project structure
src/
components/   UI components
store/        App state (authorized flag, loaded JSON, active entity)
utils/        Pure functions, schema validator
tools/
timetable_export.py   Converts ST1 xlsx → timetable.json
.claude/
rules/        Architecture reference (for Gremlin / Claude Code)
commands/     Custom slash commands

## Status
Early development. Local use / demo only.