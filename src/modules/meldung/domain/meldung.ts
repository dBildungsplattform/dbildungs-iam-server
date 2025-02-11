import { MeldungStatus } from '../persistence/meldung.entity.js';

export class Meldung<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public inhalt: string,
        public status: MeldungStatus,
        public version: number,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        inhalt: string,
        status: MeldungStatus,
        version: number,
    ): Meldung<WasPersisted> {
        return new Meldung(id, createdAt, updatedAt, inhalt, status, version);
    }

    public static createNew(inhalt: string, status: MeldungStatus): Meldung<false> {
        return new Meldung(undefined, undefined, undefined, inhalt, status, 1);
    }
}
