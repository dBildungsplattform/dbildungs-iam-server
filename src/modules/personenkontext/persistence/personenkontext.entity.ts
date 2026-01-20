import { DateTimeType, Entity, Enum, Index, ManyToOne, Opt, Property, Ref, Unique } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { RolleEntity } from '../../rolle/entity/rolle.entity.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';

@Entity({ tableName: 'personenkontext' })
@Unique({ properties: ['personId', 'organisationId', 'rolleId'] })
export class PersonenkontextEntity extends TimestampedEntity {
    @ManyToOne({
        fieldName: 'person_id',
        columnType: 'uuid',
        deleteRule: 'cascade',
        ref: true,
        nullable: false,
        entity: () => PersonEntity,
    })
    @Index({ name: 'personenkontext_person_id_index', type: 'hash' })
    public personId!: Ref<PersonEntity>;

    // TODO EW-636: get from access_token, see SchulConneX (Version 1.003.003.000) page 91
    @ManyToOne({
        fieldName: 'organisation_id',
        columnType: 'uuid',
        ref: true,
        nullable: false,
        entity: () => OrganisationEntity,
    })
    @Index({ name: 'personenkontext_organisation_id_index', type: 'hash' })
    public organisationId!: Ref<OrganisationEntity>;

    @ManyToOne({
        fieldName: 'rolle_id',
        columnType: 'uuid',
        ref: true,
        nullable: false,
        entity: () => RolleEntity,
    })
    @Index({ name: 'personenkontext_rolle_id_index', type: 'hash' })
    public rolleId!: Ref<RolleEntity>;

    @Property({ nullable: true })
    public username?: string;

    // TODO EW-636: mandant is related to organizations so it is not set for now. When implemented should be set to nullable: false

    @Property({ nullable: true })
    public mandant?: string;

    @Enum({ nullable: true, items: () => Personenstatus, nativeEnumName: 'personenstatus_enum' })
    public personenstatus?: Personenstatus;

    @Enum({ nullable: true, items: () => Jahrgangsstufe, nativeEnumName: 'jahrgangsstufe_enum' })
    public jahrgangsstufe?: Jahrgangsstufe;

    @Property({ nullable: true, default: SichtfreigabeType.NEIN, type: 'string' })
    public sichtfreigabe?: SichtfreigabeType;

    @Property({ nullable: true, type: DateTimeType })
    public loeschungZeitpunkt?: Date;

    @Property({ nullable: false, default: '1' })
    public revision!: string & Opt;

    @Property({ nullable: true, type: DateTimeType })
    public readonly befristung?: Date;
}
