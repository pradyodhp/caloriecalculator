# Architecture Audit (Milestone 0)

Audit of the repository as found at commit `8b77f5b`, before any NutriTrack changes.

## 1. Current architecture

- `backend/`: Node.js + Express 5, CommonJS, no TypeScript, no tests, no lint.
  - `server.js` (653 lines): a monolith holding the env loader, a hardcoded food table, a USDA client, a scoring service, a controller and the route setup in one file.
  - `server1.js`, `server.js.js` (empty), `inspect_response.js`, `verify_refactor.js`, `output.json`: leftover debug and experiment files.
  - `src/` is a partial refactor of `server.js`: `controllers/nutritionController.js`, `services/usdaService.js`, `services/medicalService.js`, `data/constants.js`, `routes/nutritionRoutes.js`, `middleware/errorHandler.js`.
  - One endpoint: `GET /nutrition/:item`. It returns a food plus a "health index".
  - Caching: `node-cache` in memory. Security: `helmet`, `cors()` open to all origins, a global rate limiter.
- `frontend/`: Create React App, React 19, one `App.js` (280 lines), one CSS file, the default CRA test.
- No database, no auth, no users, no diary, no CI, no Docker, no docs beyond a one-line README.

## 2. Strengths

- A working USDA FoodData Central integration idea, with caching.
- Controller/service split started in `backend/src`.
- helmet and rate limiting are already present.
- A small curated list of Indian foods, which shows the product direction.

## 3. Weaknesses

### Security
- **A USDA API key is hardcoded as a fallback in `backend/server.js:358` and `backend/src/services/usdaService.js:8`.** It is in git history, so it must be treated as leaked. The owner should rotate it at https://fdc.nal.usda.gov/api-key-signup.html. Removing the line from the code does not remove it from history.
- The key prefix is printed to the console on each request.
- CORS is open to every origin.
- Three copies of the env-loader scan multiple paths and log their findings.

### Data integrity
- `MEDICAL_FOODS_DATABASE` has about 20 foods with no source, no serving basis and no units. Values such as idli at 58 kcal are unsourced, so they cannot be treated as authoritative. They will not be carried over as data. They may only be used as a hint list of which foods to curate from a real source (IFCT 2017, USDA).
- Values are returned as display strings (`"2.04g ✅"`), mixing data and presentation.
- Nutrient basis (per 100 g, per serving, per piece) is not tracked, so "serving ambiguity" is present everywhere.

### Medical authority claims (to be removed)
- `medicalService.js` and `server.js` produce "doctor warnings", "doctor recommendations", "medical verdict", "immediate diabetes risk", "DANGEROUS" and a 0-10 "health index". Nothing in the repo cites a guideline for any threshold.
- Scoring depends on `cookingMethod` and `foodType` strings guessed from the query text.

### Structure and quality
- Duplicated logic: `server.js` and `src/` contain two copies of the same service code.
- Dead files listed above. A giant `App.js`. No tests. No typecheck. No lint.
- Frontend/backend contract is an undocumented ad-hoc JSON shape with emoji strings.
- Express 5 and React 19 are both listed in `backend/package.json` (react does not belong in the backend).

## 4. Migration strategy

Modular monolith, incremental, tests green after each milestone. Milestones are listed in `docs/roadmap.md`. The old `/nutrition/:item` endpoint keeps working until the new food search replaces it, and is then removed with a note in the changelog.

## 5. Files

| Action | Files |
|---|---|
| Preserve (reuse ideas/code) | USDA request logic in `usdaService.js`, `errorHandler.js` shape, helmet + rate-limit setup, `.gitignore` |
| Rewrite | `server.js` -> `backend/src/app.ts` + modules; `App.js` -> componentized React app; README |
| Remove | `server.js.js`, `server1.js`, `inspect_response.js`, `verify_refactor.js`, `output.json`, `medicalService.js`, `MEDICAL_*` constants, `react`/`react-dom` from backend deps |
| Replace data | `MEDICAL_FOODS_DATABASE` is replaced by sourced curated data (milestone 8) |

## 6. What must not be carried forward

Doctor/medical language, the unsourced health score, hardcoded keys, display strings as data, query-text guessing of cooking method.
