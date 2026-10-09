# NutriTrack Roadmap

Each milestone is independent: it builds, passes its own tests, and can be delivered on its own. Verification after each one: typecheck, lint, tests, build.

| # | Milestone | Outcome |
|---|---|---|
| M0 | Audit and roadmap | This document set |
| M1 | Repo hygiene and secrets | Dead files removed, hardcoded key removed, env validation, README credit |
| M2 | TypeScript backend skeleton | App/server split, config, error classes, logging, health endpoint, test runner |
| M3 | Domain models and nutrient/unit system | Typed Food, Nutrient, Serving; unit conversion; provenance fields |
| M4 | Nutrition energy engine | BMR, TDEE, calorie and macro targets, documented formulas, unit tests |
| M5 | PostgreSQL schema and migrations | Prisma schema, indexes, constraints (SQLite-free, local Postgres via Docker) |
| M6 | Food provider abstraction + USDA provider | Provider interface, USDA mapping, cache, retrieval metadata |
| M7 | Indian food provider (sourced) | Curated dataset with source per row, no unsourced values |
| M8 | Serving engine | Units, piece/katori/cup, ambiguity handling, conversions |
| M9 | Food search | Ranked unified search, pagination, indexes |
| M10 | Auth | Register, login, sessions, hashing, rate limits, deletion |
| M11 | Profile and goals | Profile, units, goals, targets API |
| M12 | Diary | Meals, entries, water, edit/delete, user-local day boundaries |
| M13 | Recipes and custom foods | Recipe nutrition, custom foods, favorites, recents |
| M14 | Progress and analytics | Weight tracking, weekly analytics, calendar data |
| M15 | Explainable insights | Rule-based, cited, no medical claims |
| M16 | Frontend rebuild | Componentized, responsive, accessible, empty/loading states |
| M17 | Security and observability | Hardening pass, structured logs, API docs |
| M18 | CI, Docker, final review | Pipelines, containers, `docs/final-architecture-review.md`, acceptance run |

AI-assisted logging stays an extension point only (see spec section 84). No LLM is added for show.
