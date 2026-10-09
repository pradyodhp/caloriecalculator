# API (v1)

All `/v1` routes need `Authorization: Bearer <access token>`. The user id always comes from the token. Errors look like `{ "error": { "code", "message" } }`. A machine-readable summary is in [openapi.yaml](openapi.yaml); a test fails if a route is added without listing it there. Request and response schemas in that file are summaries; the zod schemas in the route files are authoritative.

| Method and path | Purpose |
|---|---|
| POST /auth/register, /auth/login, /auth/refresh, /auth/logout; GET /auth/me; DELETE /auth/account | Accounts, see auth.md |
| GET /foods/search?q=&limit= | Ranked search across providers. Each result has `foodId`, source, sourceId, per-100 g nutrients with units. `providerErrors` lists failed providers |
| GET/PUT /v1/profile | Profile and unit preferences |
| GET/PUT /v1/goal | Active goal and pace |
| GET /v1/targets | Estimated calorie and macro targets; 400 lists what is missing |
| GET /v1/diary?date= | A user-local day: entries, totals by meal, water, targets, remaining (can be negative) |
| POST /v1/diary/entries | Log a food (`foodId`, `meal`, `quantity`, optional `servingLabel`). Unclear serving returns 400 with the options |
| PATCH/DELETE /v1/diary/entries/:id | Edit or soft-delete an entry |
| POST /v1/water, POST /v1/weight | Water and weight entries |
| GET /v1/progress/weight | Weight series, trend, goal progress |
| GET /v1/analytics/weekly?end= | 7-day analytics and insights, each insight with its evidence |
| POST/GET/DELETE /v1/foods/custom | User-created foods (marked unverified) |
| POST/GET/DELETE /v1/recipes | Recipes; also creates a loggable food. Nutrients missing from any ingredient are left out and listed as `omittedIncompleteNutrients` |
| GET /v1/foods/compare?a=&b=&grams= | Same-weight numbers for two foods, no verdict |
| GET/PUT/DELETE /v1/favorites[/:foodId], GET /v1/recents | Favorites and recently logged foods |
| POST /v1/diary/copy | Copy one meal or a whole day to another day (`fromDate`, `toDate`, optional `fromMeal`, `toMeal`) |
| GET /v1/diary/calendar?month=YYYY-MM | Per-day energy and entry count; unlogged days are omitted, not zero |

Not built: smart alternatives (a ranking of foods would imply a health verdict; deferred on purpose).
