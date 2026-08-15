# TimeView

Visual timetable explorer for South African schools.

Open your school's `timetable.json` and browse it by teacher, student, subject or
grade — no server, no login, no data leaving your machine.

---

## What it does

- Renders a school-wide timetable from a single JSON file
- Four search boxes: student, teacher, subject/activity, grade/reg class
- Any teacher's, student's, subject's or grade's full timetable, one click away
- Click a cell to drill in: subjects → class list → that learner's own timetable
- Compare any number of timetables in one grid, colour-coded per person, with
  shared free periods highlighted
- Expand every cell to show nested rosters, for screen and print
- Local scratch notes per cell (batting tallies, absentees, checklists), shown
  inline or as a marker dot
- Print button — lays the grid out for one landscape page
- Data lives in your browser's memory only, and never leaves the machine

## Data source

TimeView consumes a `timetable.json` produced by the suite converter
(`tools/converter` in the parent TimeEduSuite repo) or a TimeBuilder export.
The contract is the parent repo's `SCHEMA.md`; TimeView validates against it on
load and refuses a file whose major version doesn't match.

For POPIA, the sensitive JSON is never cached: TimeView reads it off disk on each
load via the browser File System Access API (Chrome/Edge). The picked file's handle
is persisted in IndexedDB — no timetable content is written to persistent storage.
The file lives in a teachers-only SharePoint library synced locally per teacher.
Browsers without the API (Firefox/Safari) fall back to a plain file picker with no
persistence (re-browse each session).

The only things TimeView does persist are a `{type, id}` reference to your last
viewed timetable and your own typed cell notes — never timetable content.

## How to run

```
npm install
npm run dev
```

Open the dev URL, then point TimeView at your `timetable.json`.

Production build: `npm run build` → `dist/` (deployed static on Cloudflare at
`timeview.egouws.com`).

Lint: `npm run lint`.

## Stack

- React + Vite
- Plain CSS, light and dark themes
- No backend, no database, no accounts, no third-party requests at runtime

## Project structure

```
src/
  components/   UI components
  store/        App state (loaded JSON, active entity, comparison entities)
  utils/        Pure functions, schema validator, file-handle store
.claude/
  rules/        Architecture reference (for Gremlin)
  commands/     Custom slash commands
```

## Status

v1 shipped; live pilot from 2026-07 (Crawford International College La Lucia).
Preparing to exit beta.
