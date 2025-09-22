export class EmailDomain<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public domain: string,
    ) {}

    public static construct(id: string, createdAt: Date, updatedAt: Date, domain: string): EmailDomain<true> {
        return new EmailDomain(id, createdAt, updatedAt, domain);
    }

    public static createNew(domain: string): EmailDomain<false> {
        return new EmailDomain(undefined, undefined, undefined, domain);
    }
}
