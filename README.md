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

## Data source

TimeView consumes a `timetable.json` produced by the suite converter
(`tools/converter` in the parent TimeEduSuite repo) or TimeBuilder export.

For POPIA, the sensitive JSON is never cached: TimeView reads it off disk on each
load via the browser File System Access API (Chrome/Edge). The picked file's handle
is persisted in IndexedDB — no timetable content is written to persistent storage.
The file lives in a teachers-only SharePoint library synced locally per teacher.
Browsers without the API (Firefox/Safari) fall back to a plain file picker with no
persistence (re-browse each session).

## How to run

npm install
npm run dev
Open the dev URL, then point TimeView at your `timetable.json`.

Production build: `npm run build` → `dist/` (deployed static on Cloudflare at
`timeview.egouws.com`).

## Stack
- React + Vite
- Plain CSS
- No backend, no database, no accounts

## Project structure
src/
components/   UI components
store/        App state (loaded JSON, active entity, comparison entities)
utils/        Pure functions, schema validator, file-handle store
tools/
subjects.py   Subject-code multiplicity tables (standalone; no React coupling)
.claude/
rules/        Architecture reference (for Gremlin / Claude Code)
commands/     Custom slash commands

## Status
v1 shipped; live pilot from 2026-07 (Crawford International College La Lucia).
Active feature work ongoing.