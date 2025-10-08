import { Entity, Enum, Index, ManyToOne, Ref } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';
import { EmailAddrEntity } from './email-address.entity.js';

export enum EmailAddressStatusEnum {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    DEACTIVE = 'DEACTIVE',
    SUSPENDED = 'SUSPENDED',
    TO_BE_DELETED = 'TO_BE_DELETED',
}

@Entity({ schema: 'email', tableName: 'address_status' })
export class EmailAddressStatusEntity extends TimestampedEntity {
    @ManyToOne({ fieldName: 'email_address_id', entity: () => EmailAddrEntity })
    @Index({ name: 'email_address_id', type: 'hash' })
    public emailAddress!: Ref<EmailAddrEntity>;

    @Enum({ items: () => EmailAddressStatusEnum, nullable: false, nativeEnumName: 'email_address_status_enum' })
    public status!: EmailAddressStatusEnum;
}
