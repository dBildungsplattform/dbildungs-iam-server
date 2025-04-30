import { BaseEntity, Entity, Enum, ManyToOne, PrimaryKeyProp, Property, Rel } from '@mikro-orm/core';
import { PersonExternalIdType } from '../domain/person.enums.js';
import { PersonEntity } from './person.entity.js';

@Entity({ tableName: 'external_id_mapping' })
export class PersonExternalIdMappingEntity extends BaseEntity {
    @ManyToOne({
        columnType: 'uuid',
        primary: true,
        ref: true,
        nullable: false,
        deleteRule: 'cascade',
        entity: () => PersonEntity,
    })
    public person!: Rel<PersonEntity>;

    @Enum({ primary: true, items: () => PersonExternalIdType, nativeEnumName: 'external_id_enum' })
    public type!: PersonExternalIdType;

    @Property()
    public externalId!: string;

    public [PrimaryKeyProp]?: ['person', 'type'];
}
