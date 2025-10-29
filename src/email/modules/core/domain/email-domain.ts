export class EmailDomain<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public domain: string,
        public spshServiceProviderId: string,
    ) {}

    public static construct(params: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        spshServiceProviderId: string;
    }): EmailDomain<true> {
        return new EmailDomain(
            params.id,
            params.createdAt,
            params.updatedAt,
            params.domain,
            params.spshServiceProviderId,
        );
    }

    public static createNew(params: { domain: string; spshServiceProviderId: string }): EmailDomain<false> {
        return new EmailDomain(undefined, undefined, undefined, params.domain, params.spshServiceProviderId);
    }
}
