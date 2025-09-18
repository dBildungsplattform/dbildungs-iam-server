import { EmailAddressStatus } from '../persistence/email-address.entity.js';

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public address: string,
        public priority: number,
        public status: EmailAddressStatus,
        public markedForCron?: Date,
        public spshPersonId?: string,
        public oxUserId?: string,
    ) {}

    public static construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        address: string,
        priority: number,
        status: EmailAddressStatus,
        markedForCron?: Date,
        spshPersonId?: string,
        oxUserId?: string,
    ): EmailAddress<true> {
        return new EmailAddress(
            id,
            createdAt,
            updatedAt,
            address,
            priority,
            status,
            markedForCron,
            spshPersonId,
            oxUserId,
        );
    }

    public static createNew(
        address: string,
        priority: number,
        status: EmailAddressStatus,
        markedForCron?: Date,
        spshPersonId?: string,
        oxUserId?: string,
    ): EmailAddress<false> {
        return new EmailAddress(
            undefined,
            undefined,
            undefined,
            address,
            priority,
            status,
            markedForCron,
            spshPersonId,
            oxUserId,
        );
    }
}
