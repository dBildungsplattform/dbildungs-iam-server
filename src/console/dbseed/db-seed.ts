import { DbSeedStatus } from './repo/db-seed.entity.js';

export class DbSeed<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public executedAt: Persisted<Date, WasPersisted>,
        public status: DbSeedStatus,
        public path: string | undefined,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        executedAt: Date,
        status: DbSeedStatus,
        path?: string,
    ): DbSeed<WasPersisted> {
        return new DbSeed(id, executedAt, status, path);
    }

    public static createNew(id: string, status: DbSeedStatus, path?: string): DbSeed<false> {
        return new DbSeed(id, undefined, status, path);
    }

    public setDone(): void {
        this.status = DbSeedStatus.DONE;
    }

    public setFailed(): void {
        this.status = DbSeedStatus.FAILED;
    }
}
