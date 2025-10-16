import { EmailAddressStatus } from "./email-address-status";

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public address: string,
        public priority: number,
        public spshPersonId?: string,
        public oxUserId?: string,
        public markedForCron?: Date,
        public status?: EmailAddressStatus<WasPersisted>,
    ) {}

    public static construct(params: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        priority: number;
        spshPersonId?: string;
        oxUserId?: string;
        markedForCron?: Date;
        status?: EmailAddressStatus<true>;
    }): EmailAddress<true> {
        return new EmailAddress(
            params.id,
            params.createdAt,
            params.updatedAt,
            params.address,
            params.priority,
            params.spshPersonId,
            params.oxUserId,
            params.markedForCron,
            params.status,
        );
    }

    public static createNew(params: {
        address: string;
        priority: number;
        spshPersonId?: string;
        oxUserId?: string;
        markedForCron?: Date;
        status?: EmailAddressStatus<false>;
    }): EmailAddress<false> {
        return new EmailAddress(
            undefined,
            undefined,
            undefined,
            params.address,
            params.priority,
            params.spshPersonId,
            params.oxUserId,
            params.markedForCron,
            params.status,
        );
    }
}
