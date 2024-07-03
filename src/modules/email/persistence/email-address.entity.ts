import { Entity, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

@Entity({ tableName: 'email_address' })
export class EmailAddressEntity extends TimestampedEntity {
    @ManyToOne({
        columnType: 'uuid',
        fieldName: 'person_id',
        ref: true,
        nullable: true,
        deleteRule: 'set null',
        entity: () => PersonEntity,
    })
    public personId!: Ref<PersonEntity>;

    @Property({ primary: true, nullable: false, unique: true })
    public address!: string;

    @Property({ nullable: false })
    public enabled!: boolean;
}
