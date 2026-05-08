# Database Migrations

This project uses Prisma models with a Supabase/PostgreSQL database. Schema changes must be versioned in `supabase/migrations` in the same pull request as the code that depends on them.

## Local Checks

Run these before opening a PR:

```bash
npm run db:check-migrations
npx prisma validate
npx prisma generate
```

## Creating A Migration

After changing the database schema, create a SQL migration and commit it:

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-url "$DATABASE_URL" \
  --script > supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

Review the generated SQL before committing it. Do not commit empty migration files.

## Existing Databases

The current first migration is a baseline generated from `prisma/schema.prisma`. For databases that already have this schema, treat it as the starting point for future versioning rather than reapplying it blindly to production.
