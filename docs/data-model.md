# Data model

Defined in `backend/prisma/schema.prisma`; initial SQL in `backend/prisma/migrations/0001_init`.

- **Provenance on every food**: `sourceType` (usda, curated_indian, user, community, demo), `source`, `sourceId`, `sourceVersion`, `verificationStatus`, `retrievedAt`. `(sourceType, sourceId)` is unique.
- **Nutrients** live in `FoodNutrient` per 100 g with an explicit unit; there is no unitless value.
- **Servings** carry a gram weight plus `sourceNote` and `isEstimate`, so a serving is never presented as exact when it is not.
- **Multi-tenancy**: every user-owned table has `userId` (or reaches it through a parent) and cascades on user deletion. User-created foods set `ownerUserId`.
- **Diary days** are `localDate` (user-local date), separate from timestamps.
- **Soft delete** (`deletedAt`) on users, foods, meals, entries, recipes.
- **Indexes**: food canonical name and source, meal (user, date), water (user, date), weight (user, date unique), favorites by user.
- **Verification**: migrations 0001-0003 were applied to a real PostgreSQL 18 (embedded-postgres) and the acceptance flow test passes against it. Run it yourself: `docker compose up -d db`, `npm run db:migrate`, `DATABASE_URL=... npm test`.
