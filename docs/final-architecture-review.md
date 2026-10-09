# Final architecture review

Honest status of the NutriTrack rebuild at the time of writing. Scores are the builder's own assessment out of 10, not an external audit.

| Area | Score | Why |
|---|---|---|
| Architecture | 7 | Modular monolith: pure domain logic (units, energy, serving, diary, recipe, progress, insights) separated from HTTP and Prisma. Provider interface for food sources. Dependency injection in `createApp`. |
| Code quality | 7 | Strict TypeScript, zod validation at the edge, one error hierarchy. Some route files mix validation and queries; no lint config yet. |
| Security | 6 | scrypt passwords, short JWTs, rotating hashed refresh tokens, per-user scoping verified by tests, rate limits, helmet, CORS allowlist, no secret defaults. Gaps below. |
| Data quality | 7 | Every food carries source, ID, basis and units; unit conversions tested; missing values stay missing; recipes list incomplete nutrients. Weakness: only raw-ingredient Indian data (IFCT) and USDA; no sourced dish data. |
| UX | 6 | Clean, accessible-by-labels, fast logging flow, empty/loading/error states. Verified in headless Chrome on desktop only. No recipe, custom-food or comparison screens. |
| Testing | 7 | 54 unit/integration tests plus live PostgreSQL acceptance and auth tests; 4 frontend tests. No browser e2e suite in CI, no load tests. |
| Scalability | 5 | Stateless API, indexes, pagination limits, provider caching. In-memory USDA cache and rate limiter are per process. Not load tested. |
| Production readiness | 4 | See limitations. Not ready for real users. |

## Known limitations

- **Security gaps**: no password reset or email verification (no email sender), no OAuth, no account lockout beyond rate limiting, refresh token kept in `localStorage` (XSS exposure; an httpOnly cookie flow would be safer), no CSRF concerns today because tokens are in headers, `npm audit` reports 3 high issues in a transitive Prisma dependency (deepmerge-ts) that need a breaking upgrade, not applied.
- **A USDA API key was committed in the original repository history.** It must be revoked at the provider; removing it from code does not remove it from history.
- **Indian dishes**: IFCT covers raw foods. Idli, dosa and similar are not included. No dish values were invented.
- **Household servings** (piece, katori) exist only when a user enters the gram weight; they are flagged as estimates.
- **Not built**: smart alternatives (deferred: a ranking implies a health verdict), AI-assisted logging (extension point only, by design), observability beyond JSON logs.
- **Not verified**: GitHub Actions run, Docker image build, behaviour on mobile devices, behaviour under load, USDA live responses (no API key was available; the mapping is unit tested against the documented nutrient numbers only).
- Targets use standard formulas and are estimates. Floors and macro splits are app defaults, not clinical standards (see `energy-formulas.md`).

## Technical debt

- Route handlers query Prisma directly; moving that into repositories would make them unit-testable without a database.
- `NutrientValue` keys are strings; a union type or registry would catch typos.
- Frontend has no router, global store or component tests beyond smoke tests.
- Duplicate nutrient scaling exists in the diary route and the pure `totals.ts` module.

## Future work

Password reset with a real email provider, httpOnly cookie sessions, OpenAPI, favorites and recents, comparison, dish-level sourced data, mobile layout testing, browser e2e in CI, load testing, observability.
