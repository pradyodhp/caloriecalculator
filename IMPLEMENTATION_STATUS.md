# Implementation Status

| Milestone | Status |
|---|---|
| M0 Audit and roadmap | Done |
| M1 Hygiene, secrets, honest legacy lookup | Done (backend tests: 4 passing; frontend patched to the new response shape) |
| M2 TypeScript backend skeleton | Done (strict TS, typecheck + build + 6 tests pass) |
| M3 Unit system and nutrient scaling | Done (11 tests total) |
| M4 Energy target engine | Done (17 tests total, formulas in docs/energy-formulas.md) |
| M5 PostgreSQL schema and migration | Done: schema valid, SQL generated; not yet applied to a live DB |
| M6 Provider layer and unified food search | Done (GET /foods/search, ranking, partial-failure reporting; 21 tests) |
| M7 Indian food provider (IFCT 2017 importer) | Done: importer + provider + tests; dataset not vendored (AGPL); prepared dishes like idli not covered by IFCT |
| M8 Serving engine | Done: mass servings exact, household servings need a sourced or user-entered gram weight and are flagged approximate; ambiguity raises an error (30 tests) |
| Auth (register, login, refresh rotation, logout, delete account) | Done: 39 tests with in-memory repo; Prisma repo not live-tested; password reset and OAuth not built |
| Diary engine (user-local dates, day totals, remaining) and recipe nutrition engine | Done: pure logic, 48 tests; HTTP endpoints and DB persistence for diary/recipes not yet wired |
| Progress (weight trend, goal %), weekly analytics, rule-based explainable insights | Done: pure logic, 54 tests |
| CI workflow (backend typecheck/test/build/db validate, frontend build) and backend Dockerfile | Done: written, not yet run on GitHub or built with Docker here |
| Remaining: profile/goals API, diary+recipe+progress endpoints with persistence, frontend rebuild, hardening, final review | Not started |

Known: a USDA key was committed in earlier history and must be rotated by the owner.
| Foods tab: custom foods, recipe builder, compare, favorites and recents | Done: driven in headless Chrome against live API (custom food + recipe saved) |
| OpenAPI summary (docs/openapi.yaml) with route-drift test | Done: schemas are summaries, zod is authoritative |
| Copy meal/day (API + "Copy yesterday" button), month calendar (API + History tab), day navigation | Done: 60 tests with live DB; driven in headless Chrome |
