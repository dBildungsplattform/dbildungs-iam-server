# Migration via Mikro-Orm Extension

## Commands

Run `npm run db:migr` to create a new migration

Run `npm run db:migr up` apply the latest version of migration to the database, latest migration files MUST BE available in `./dist/migrations`.
You can ensure this by starting the app via `npm run start`.

Run `npm run db:migr init` to create a new initial migration (not necessary anymore, initial migration has been done)


## Execution

## Files

Migration files are stored in ./migrations

## Tests

For testing purposes of the migration-console another directory `./test-migrations` is created during test execution.
This directory is deleted before test-execution to avoid errors regarding existing migration-files, it is also included in the [.gitignore](./../.gitignore)
