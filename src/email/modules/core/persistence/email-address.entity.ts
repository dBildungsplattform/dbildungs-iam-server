import { DateTimeType, Entity, Index, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';

@Entity({ schema: 'email', tableName: 'address' })
export class EmailAddrEntity extends TimestampedEntity {
    //Cannot be Named EmailAddressEntity for now due to ERROR [ExceptionHandler] Duplicate entity names are not allowed: EmailAddressEntity
    @Property({ nullable: false, unique: true })
    public address!: string;

    @Property({ nullable: false })
    public priority!: number;

    @Property({ nullable: true })
    public oxUserId?: string;

    @Property({ nullable: true })
    public ldapEntryUUID?: string; //If address is removed from LDAP because priority gets higher then 1, this field must be set to null

    @Property({ nullable: true })
    @Index({
        name: 'email_address_spsh_person_id_index',
    })
    public spshPersonId?: string;

    @Property({ nullable: true, type: DateTimeType })
    public markedForCron?: Date;
}
