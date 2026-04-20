# TimeView — CLAUDE.md

## Project
Standalone React SPA. Timetable viewer for South African schools.
No backend. No DB. Data = timetable.json uploaded by user, lives in browser memory only.

## Roles
- Eugene = architect. Reviews all plans before any code is written.
- Gremlin (you) = builder. Plan-first: present approach, wait for approval, then implement.

## Stack
- React + Vite (single-file components where practical)
- Plain CSS (no Tailwind, no UI library unless Eugene approves)
- tools/ = standalone Python scripts (no React dependency)

## Layer Rules
- src/components/ — UI only, reads from src/store/ or props
- src/store/ — app state (JSON data, authorized flag, active entity)
- src/utils/ — pure functions, no React imports
- tools/ — Python only, no imports from src/

## Commands
- /session-end — see .claude/commands/session-end.md

## Hard Rules
1. Never write code until Eugene has approved the plan.
2. Never modify CLAUDE.md (Eugene owns it).
3. Never push to git. Eugene handles git.
4. authorized flag controls upload button visibility — never remove this gate.
5. Schema version must be checked on JSON upload. Warn on mismatch, do not silently accept.
6. tools/ and src/ are independent — no runtime coupling.
7. Never remove anything or run rm commands without approval.

## Current State
Session 0 complete. See HANDOFF.md.
Detailed reference: .claude/rules/