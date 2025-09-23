import { DateTimeType, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';

export enum EmailAddressStatus {
    PENDING = 'PENDING',
}

@Entity({ schema: 'email', tableName: 'address' })
export class MailAddressEntity extends TimestampedEntity { //Cannot be Named EmailAddressEntity for now due to ERROR [ExceptionHandler] Duplicate entity names are not allowed: EmailAddressEntity
    @Property({ nullable: false, unique: true })
    public address!: string;

    @Property({ nullable: false })
    public priority!: number;

    @Enum({ items: () => EmailAddressStatus, nullable: false, nativeEnumName: 'email_address_status_enum' })
    public status!: EmailAddressStatus;

    @Property({ nullable: true })
    public oxUserId?: string;

    @Property({ nullable: true })
    @Index({
        name: 'email_address_spsh_person_id_index',
    })
    public spshPersonId?: string;

    @Property({ nullable: true, type: DateTimeType })
    public markedForCron?: Date;
}
