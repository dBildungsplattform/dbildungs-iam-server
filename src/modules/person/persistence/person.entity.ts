import {
    Cascade,
    Collection,
    Entity,
    Enum,
    Index,
    ManyToOne,
    OneToMany,
    Property,
    ArrayType,
    DateTimeType,
} from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { DataProviderEntity } from '../../../persistence/data-provider.entity.js';

@Entity({ tableName: 'person' })
export class PersonEntity extends TimestampedEntity {
    /**
     * @deprecated This constructor is for automapper only.
     */
    public constructor() {
        super();
    }

    @Index({
        name: 'person_keycloak_user_id_unique',
        expression:
            'create unique index "person_keycloak_user_id_unique" on "person" ("keycloak_user_id") nulls not distinct;',
    })
    @Property()
    public keycloakUserId!: string;

    @Property({ nullable: true })
    public referrer?: string;

    @Property()
    public mandant!: string;

    @Property({ nullable: true })
    public readonly stammorganisation?: string;

    @Property()
    public familienname!: string;

    @Property()
    public vorname!: string;

    @Property({ nullable: true })
    public initialenFamilienname?: string;

    @Property({ nullable: true })
    public initialenVorname?: string;

    @Property({ nullable: true })
    public rufname?: string;

    @Property({ nullable: true })
    public nameTitel?: string;

    @Property({ nullable: true, type: ArrayType })
    public nameAnrede?: string[];

    @Property({ nullable: true, type: ArrayType })
    public namePraefix?: string[];

    @Property({ nullable: true, type: ArrayType })
    public nameSuffix?: string[];

    @Property({ nullable: true })
    public nameSortierindex?: string;

    @Property({ nullable: true, type: DateTimeType })
    public geburtsdatum?: Date;

    @Property({ nullable: true })
    public geburtsort?: string;

    @Enum({ items: () => Geschlecht, nullable: true, nativeEnumName: 'geschlecht_enum' })
    public geschlecht?: Geschlecht;

    @Property({ nullable: true })
    public lokalisierung?: string;

    @Enum({ items: () => Vertrauensstufe, nullable: true, nativeEnumName: 'vertrauensstufe_enum' })
    public vertrauensstufe?: Vertrauensstufe;

    @Property({ nullable: true })
    public auskunftssperre?: boolean;

    @ManyToOne({ nullable: true })
    public dataProvider?: DataProviderEntity;

    @Property({ nullable: false, default: '1' })
    public revision!: string;

    @Index({
        name: 'person_personalnummer_unique',
        expression: 'create unique index "person_personalnummer_unique" on "person" ("personalnummer") nulls distinct;',
    })
    @Property({ nullable: true })
    public personalnummer?: string;

    @OneToMany({
        entity: () => PersonenkontextEntity,
        mappedBy: 'personId',
        cascade: [Cascade.REMOVE],
        orphanRemoval: true,
    })
    public personenKontexte: Collection<PersonenkontextEntity> = new Collection<PersonenkontextEntity>(this);
}
