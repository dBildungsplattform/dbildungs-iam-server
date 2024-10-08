# Migration via Mikro-ORM Extension

## Commands

Run `npm run db:migration-create` to create a new migration

[!IMPORTANT]
Files are generated and stored under `migrations`.
The copy step into the charts folder which formerly was necessary is not needed anymore.

Run `npm run db:migration-apply` apply the latest version of migration to the database, latest migration files MUST BE available in `./dist/migrations`.
You can ensure this by starting the app via `npm run start`.

Run `npm run db:migration-init` to create a new initial migration (not necessary anymore, initial migration has been done)
The execution of migration-init can cause following error with current configuration:
```bash
...
[Error: ENOENT: no such file or directory, open '.../dbildungs-iam-server/migrations/.snapshot-dbildungs-iam-server.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '...dbildungs-iam-server/migrations/.snapshot-dbildungs-iam-server.json'
}
```

To be able to execute migration-init, temporally adjust `path` in migrations-configuration of console.module.ts
```typescript
extensions: [Migrator],
    migrations: {
    tableName: 'mikro_orm_migrations'
        path: './dist/migrations',
        pathTs: './migrations',
```

## Execution

### Noteworthy

- The parameter `disableForeignKeys` has to be false for execution in cluster, permissions are not sufficient.
- Local the usage of `disableForeignKeys: true` is possible.

### On branched enviroments
`npm run db:migration-apply` is run via pipeline for the individual environments.

### On DEV and TEST
Like with some other tasks regarding database, migration on DEV and TEST is easier to apply, if tables or whole schema can be dropped beforehand.

## Files

Migration files are stored in ./migrations

## Tests

For testing purposes of the migration-console another directory `./test-migrations` is created during test execution.
This directory is deleted before test-execution to avoid errors regarding existing migration-files, it is also included in the [.gitignore](./../.gitignore)
