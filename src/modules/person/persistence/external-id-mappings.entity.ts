import { BaseEntity, Entity, Enum, Index, ManyToOne, PrimaryKeyProp, Property, Rel } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';
import { PersonExternalIdType } from '../domain/person.enums.js';

// TODO: Migrations
@Entity({ tableName: 'external_id_mapping' })
export class PersonExternalIdMappingEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => PersonEntity })
    @Index({
        name: 'external_id_person_index',
    })
    public person!: Rel<PersonEntity>;

    @Enum({ primary: true, items: () => PersonExternalIdType, nativeEnumName: 'external_id_enum' })
    public type!: PersonExternalIdType;

    @Property()
    public externalId!: string;

    public [PrimaryKeyProp]?: ['person', 'type'];
}
