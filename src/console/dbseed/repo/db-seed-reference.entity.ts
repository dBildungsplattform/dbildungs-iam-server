import { BaseEntity, Entity, Enum, PrimaryKeyProp, Property } from '@mikro-orm/core';

export enum ReferencedEntityType {
    PERSON = 'PERSON',
    ORGANISATION = 'ORGANISATION',
    ROLLE = 'ROLLE',
    ROLLENERWEITERUNG = 'ROLLENERWEITERUNG',
    SERVICE_PROVIDER = 'SERVICE_PROVIDER',
    EMAIL_DOMAIN = 'EMAIL_DOMAIN',
}

@Entity({ tableName: 'seeding_reference' })
export class DbSeedReferenceEntity extends BaseEntity {
    @Enum({ items: () => ReferencedEntityType, nativeEnumName: 'referenced_entity_type_enum' })
    public referencedEntityType!: ReferencedEntityType;

    @Property({ primary: true, nullable: false })
    public virtualId!: number;

    @Property({ primary: true, nullable: false })
    public uuid!: string;

    public [PrimaryKeyProp]?: ['virtualId', 'uuid'];
}
