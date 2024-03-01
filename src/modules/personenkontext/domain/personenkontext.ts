export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: string,
        public readonly organisationId: string,
        public readonly rolleId: string,
    ) {}

    public static createNew(personId: string, organisationId: string, rolleId: string): Personenkontext<false> {
        return new Personenkontext(undefined, undefined, undefined, personId, organisationId, rolleId);
    }

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: string,
        organisationId: string,
        rolleId: string,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(id, createdAt, updatedAt, personId, organisationId, rolleId);
    }
}
