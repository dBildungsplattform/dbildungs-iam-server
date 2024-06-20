import { Cascade, Collection, Entity, ManyToOne, OneToMany, Ref } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { EmailAddressEntity } from './email-address.entity.js';

@Entity({ tableName: 'email' })
export class EmailEntity extends TimestampedEntity {
    @OneToMany({
        entity: () => EmailAddressEntity,
        mappedBy: 'email',
        orphanRemoval: true,
        cascade: [Cascade.ALL],
    })
    public emailAddresses: Collection<EmailAddressEntity> = new Collection<EmailAddressEntity>(this);

    @ManyToOne({
        columnType: 'uuid',
        ref: true,
        nullable: false,
        entity: () => PersonEntity,
    })
    public personId!: Ref<PersonEntity>;
}
