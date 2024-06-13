import { Entity, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';

@Entity({ tableName: 'email' })
export class EmailEntity extends TimestampedEntity {
    @Property()
    public name!: string;

    @Property()
    public enabled!: boolean;

    @ManyToOne({
        columnType: 'uuid',
        ref: true,
        nullable: false,
        entity: () => PersonEntity,
    })
    public personId!: Ref<PersonEntity>;
}
