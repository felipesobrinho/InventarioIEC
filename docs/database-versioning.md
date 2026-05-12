# Database versioning

This project treats `main` as the source of truth for the production Supabase
database. Feature branches may add SQL migrations, but production is only
changed after those migrations land on `main`.

## Local database

Create a local PostgreSQL database and point `.env.local` to it:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/inventarioiec"
LOCAL_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/inventarioiec"
```

Use `DATABASE_URL` locally because Next.js and Prisma read it by default.
Use `LOCAL_DATABASE_URL` for scripts that must never target production.

## Migration naming

Use this format:

```txt
YYYYMMDDHHMMSS_descriptive_name.sql
```

Examples:

```txt
20260512090000_baseline_supa_current_schema.sql
20260512103000_feature_localidades.sql
```

## Feature workflow

1. Start from an up-to-date `main`.
2. Dump the current Supabase schema for reference:

   ```bash
   npm run db:pull:supa-prisma
   npm run db:generate:baseline
   ```

3. Create one feature migration in `supabase/migrations`.
4. Apply and test migrations locally:

   ```bash
   npm run db:apply:local
   npm run db:diff:local
   npm run db:validate
   ```

5. Open a PR. CI applies all migrations to a disposable PostgreSQL service and
   compares the resulting schema with `prisma/schema.prisma`.
6. After merge to `main`, the protected production migration job can apply the
   same SQL files to Supabase.

## Production safety

Do not run migration scripts against `.env` from a feature branch. Production
database writes should happen from CI on `main`, using GitHub secrets.

The production job starts at the first feature migration through
`MIGRATION_START_AT`, because the baseline represents schema that already exists
in Supabase production.
