# MySQL → PostgreSQL migration notes

## What changed in these files

- **`config/db.js`** (new) — replaces the old `mysql2` pool with a `pg` `Pool`.
  Exports the pool directly (so `db.query(...)` keeps working) and also
  `getPool()`, since `authController.js` uses that for transactions.
- **Placeholders**: `?` → `$1, $2, ...` everywhere.
- **Result shape**: `mysql2` returns `[rows, fields]` (array destructuring);
  `pg` returns `{ rows, rowCount, ... }`. Every `db.query(...)` call site was
  updated from `const [rows] = await db.query(...)` to
  `const result = await db.query(...); result.rows`.
- **Auto-increment IDs**: `result.insertId` doesn't exist in `pg`. Every
  `INSERT` now ends with `RETURNING id`, and the new id is read from
  `result.rows[0].id`.
- **Affected rows**: `result.affectedRows` → `result.rowCount`.
- **Upserts**: `INSERT ... ON DUPLICATE KEY UPDATE col = VALUES(col)` →
  `INSERT ... ON CONFLICT (user_id) DO UPDATE SET col = EXCLUDED.col`
  (in `profileController.js`). This assumes `user_id` has a `UNIQUE`
  constraint on `employer_profiles` and `job_seeker_profiles`, same as the
  original MySQL schema needed for `ON DUPLICATE KEY UPDATE` to behave as an
  upsert.
- **Case-insensitive search**: `jobController.js`'s keyword/title/company/
  location filters used `LIKE`, which is case-insensitive under MySQL's
  default collation but case-*sensitive* in Postgres. Switched to `ILIKE` to
  preserve the original behavior.
- **`COUNT(*)`**: Postgres returns `bigint` for `COUNT(*)`, which `pg` maps to
  a JS string, not a number. Added `::int` casts in `adminController.js` so
  `stats.users`, `stats.jobs`, etc. stay numbers in the JSON response.

## Two bugs fixed along the way (unrelated to the DB engine, but blocking)

1. **`authController.js`** had a stray extra `});` right after the "email
   already registered" `ROLLBACK` branch, which broke the file's syntax
   entirely. Removed.
2. **`jobController.js`**'s `updateJob` called `pool.query(...)`, but `pool`
   was never defined in that file (only `db` is imported) — this would have
   thrown `ReferenceError: pool is not defined` on every job update. Changed
   to `db.query(...)`.

## What you still need to do

1. **Install `pg`, remove `mysql2`** (if `mysql2` isn't used elsewhere):
   ```bash
   npm install pg
   npm uninstall mysql2
   ```
2. **Environment variables** — `config/db.js` looks for either:
   - `DATABASE_URL` (a full connection string, e.g. from Neon/Supabase/Render), or
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - Optionally set `DB_SSL=true` if your Postgres provider requires SSL.
3. **Schema**: your MySQL schema (`CREATE TABLE` statements, `AUTO_INCREMENT`,
   `ENUM`s, etc.) will need to be translated to Postgres DDL — that wasn't
   included in this upload, so it isn't covered here. Key things to watch for:
   - `AUTO_INCREMENT` → `SERIAL` / `GENERATED ALWAYS AS IDENTITY`
   - `ENUM(...)` columns → either a Postgres `ENUM` type or a `CHECK` constraint
   - Make sure `employer_profiles.user_id` and `job_seeker_profiles.user_id`
     have a `UNIQUE` constraint (required for the `ON CONFLICT` upserts above).
4. If you have other files outside this `controllers/` zip (routes, models,
   migrations, seed scripts) that also import `mysql2` or use `?` placeholders,
   they'll need the same treatment — happy to convert those too if you upload them.
