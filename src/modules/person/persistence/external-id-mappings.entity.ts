import { BaseEntity, Entity, Enum, Index, ManyToOne, PrimaryKeyProp, Property, Rel } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';

// TODO: Move this enum
export enum ExternalIdType {
    LDAP = 'LDAP',
}

// TODO: Migrations
@Entity({ tableName: 'external_id_mapping' })
export class ExternalIdMappingEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => PersonEntity })
    @Index({
        name: 'external_id_person_index',
    })
    public person!: Rel<PersonEntity>;

    @Enum({ primary: true, items: () => ExternalIdType, nativeEnumName: 'external_id_enum' })
    public type!: ExternalIdType;

    @Property()
    public externalId!: string;

    public [PrimaryKeyProp]?: ['person', 'type'];
}
