import { Collection, DateTimeType, Entity, Index, OneToMany, Property, QueryOrder } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';
import { EmailAddressStatusEntity } from './email-address-status.entity.js';
import { PersonExternalID } from '../../../../shared/types/aggregate-ids.types.js';

@Entity({ schema: 'email', tableName: 'address' })
export class EmailAddrEntity extends TimestampedEntity {
    //Cannot be Named EmailAddressEntity for now due to ERROR [ExceptionHandler] Duplicate entity names are not allowed: EmailAddressEntity
    @Property({ nullable: false, unique: true })
    public address!: string;

    @Property({ nullable: false })
    public priority!: number;

    @Property({ nullable: true })
    public oxUserCounter?: string;

    @Property({ nullable: false })
    @Index({
        name: 'email_address_spsh_external_id_index',
    })
    public externalId!: PersonExternalID; //used as ox username and ldap uid --> spshusername for all existing (stable, doesnt event change on rename) and spshpersonId for all new

    @Property({ nullable: false })
    @Index({
        name: 'email_address_spsh_person_id_index',
    })
    public spshPersonId!: string;

    @Property({ nullable: true, type: DateTimeType })
    public markedForCron?: Date;

    @OneToMany({
        entity: () => EmailAddressStatusEntity,
        mappedBy: 'emailAddress',
        eager: true,
        orphanRemoval: true,
        orderBy: { createdAt: QueryOrder.DESC },
    })
    public statuses: Collection<EmailAddressStatusEntity> = new Collection<EmailAddressStatusEntity>(this);
}
