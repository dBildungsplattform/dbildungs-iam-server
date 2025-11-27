export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public address: string,
        public priority: number,
        public externalId: string,
        public spshPersonId?: string,
        public oxUserCounter?: string,
        public markedForCron?: Date,
    ) {}

    public static construct(params: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        priority: number;
        externalId: string;
        spshPersonId?: string;
        oxUserCounter?: string;
        markedForCron?: Date;
    }): EmailAddress<true> {
        return new EmailAddress(
            params.id,
            params.createdAt,
            params.updatedAt,
            params.address,
            params.priority,
            params.externalId,
            params.spshPersonId,
            params.oxUserCounter,
            params.markedForCron,
        );
    }

    public static createNew(params: {
        address: string;
        priority: number;
        externalId: string;
        spshPersonId?: string;
        oxUserCounter?: string;
        markedForCron?: Date;
    }): EmailAddress<false> {
        return new EmailAddress(
            undefined,
            undefined,
            undefined,
            params.address,
            params.priority,
            params.externalId,
            params.spshPersonId,
            params.oxUserCounter,
            params.markedForCron,
        );
    }
}
