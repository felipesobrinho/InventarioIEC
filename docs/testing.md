# Testing

The active automated validation for this project lives in the npm scripts and
GitHub Actions workflows.

## Local commands

```bash
npm run lint
npm run test
npm run test:e2e
npm run db:validate
```

## Test locations

- Unit and component tests: `__tests__/`
- End-to-end tests: `e2e/`
- Database migration validation: `.github/workflows/database-migrations.yml`

## Notes

The old `test-guide/` folder was removed because it described commented-out
workflows and no longer matched the repository's active CI setup.
