import { EmailAddressStatusEnum } from '../../persistence/email-address-status.entity.js';

export class EmailAddressStatus<WasPersisted extends boolean> {
    public constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public emailAddressId: string,
        public status: EmailAddressStatusEnum,
    ) {}

    public static construct(params: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        emailAddressId: string;
        status: EmailAddressStatusEnum;
    }): EmailAddressStatus<true> {
        return new EmailAddressStatus(
            params.id,
            params.createdAt,
            params.updatedAt,
            params.emailAddressId,
            params.status,
        );
    }

    public static createNew(params: {
        emailAddressId: string;
        status: EmailAddressStatusEnum;
    }): EmailAddressStatus<false> {
        return new EmailAddressStatus(undefined, undefined, undefined, params.emailAddressId, params.status);
    }
}
