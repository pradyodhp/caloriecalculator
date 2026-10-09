# API (v1)

All `/v1` routes need `Authorization: Bearer <access token>`. The user id always comes from the token. Errors look like `{ "error": { "code", "message" } }`. Interactive OpenAPI docs are not built yet.

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

Not yet built: favorites, recents, meal copy, food comparison, alternatives, calendar view.
