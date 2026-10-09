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
| Remaining: profile/goals API, diary+recipe+progress endpoints with persistence, frontend, hardening, CI/Docker, final review | Not started |

Known: a USDA key was committed in earlier history and must be rotated by the owner.
