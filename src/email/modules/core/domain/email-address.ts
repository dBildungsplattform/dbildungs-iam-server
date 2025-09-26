import { EmailAddressStatus } from '../persistence/email-address.entity.js';

export class EmailAddress<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public address: string,
        public priority: number,
        public status: EmailAddressStatus,
        public spshPersonId?: string,
        public oxUserId?: string,
        public markedForCron?: Date,
    ) {}

    public static construct(params: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        priority: number;
        status: EmailAddressStatus;
        spshPersonId?: string;
        oxUserId?: string;
        markedForCron?: Date;
    }): EmailAddress<true> {
        return new EmailAddress(
            params.id,
            params.createdAt,
            params.updatedAt,
            params.address,
            params.priority,
            params.status,
            params.spshPersonId,
            params.oxUserId,
            params.markedForCron,
        );
    }

    public static createNew(params: {
        address: string;
        priority: number;
        status: EmailAddressStatus;
        spshPersonId?: string;
        oxUserId?: string;
        markedForCron?: Date;
    }): EmailAddress<false> {
        return new EmailAddress(
            undefined,
            undefined,
            undefined,
            params.address,
            params.priority,
            params.status,
            params.spshPersonId,
            params.oxUserId,
            params.markedForCron,
        );
    }
}
