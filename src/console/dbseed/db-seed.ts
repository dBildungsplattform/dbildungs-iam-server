import { DbSeedStatus } from './repo/db-seed.entity.js';

export class DbSeed<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public executedAt: Persisted<Date, WasPersisted>,
        public status: DbSeedStatus,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        executedAt: Date,
        status: DbSeedStatus,
    ): DbSeed<WasPersisted> {
        return new DbSeed(id, executedAt, status);
    }

    public static createNew(id: string, status: DbSeedStatus): DbSeed<false> {
        return new DbSeed(id, undefined, status);
    }
}
