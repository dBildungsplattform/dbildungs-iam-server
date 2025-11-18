import { Collection, DateTimeType, Entity, Index, OneToMany, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';
import { EmailAddressStatusEntity } from './email-address-status.entity.js';

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
    public externalId!: string; //used as ox username and ldap uid --> spshusername for all existing (stable, doesnt event change on rename) and spshpersonId for all new

    @Property({ nullable: true })
    @Index({
        name: 'email_address_spsh_person_id_index',
    })
    public spshPersonId?: string;

    @Property({ nullable: true, type: DateTimeType })
    public markedForCron?: Date;

    @OneToMany(() => EmailAddressStatusEntity, (status: EmailAddressStatusEntity) => status.emailAddress)
    public statuses: Collection<EmailAddressStatusEntity, object> = new Collection<EmailAddressStatusEntity>(this);
}
