import { AutoMap } from '@automapper/classes';
import { Collection, DateTimeType, Entity, Index, ManyToOne, OneToMany, Property, QueryOrder } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { DataProviderEntity } from '../../../persistence/data-provider.entity.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { EmailAddressEntity } from '../../email/persistence/email-address.entity.js';
import { UserLockEntity } from '../../keycloak-administration/entity/user-lock.entity.js';
import { PersonExternalIdMappingEntity } from './external-id-mappings.entity.js';

@Entity({ tableName: 'person' })
export class PersonEntity extends TimestampedEntity {
    /**
     * @deprecated This constructor is for automapper only.
     */
    public constructor() {
        super();
    }

    @AutoMap()
    @Index({
        name: 'person_keycloak_user_id_unique',
        expression:
            'create unique index "person_keycloak_user_id_unique" on "person" ("keycloak_user_id") nulls not distinct;',
    })
    @Property()
    public keycloakUserId!: string;

    @AutoMap()
    @Index({
        name: 'person_referrer_trgm_index',
        expression: 'create index "person_referrer_trgm_index" on "person" using gin ("referrer" gin_trgm_ops);',
    })
    @Property({ nullable: true })
    public referrer?: string;

    @AutoMap()
    @Property()
    public mandant!: string;

    @AutoMap()
    @Property({ nullable: true })
    public readonly stammorganisation?: string;

    @AutoMap()
    @Index({
        name: 'person_familienname_trgm_index',
        expression:
            'create index "person_familienname_trgm_index" on "person" using gin ("familienname" gin_trgm_ops);',
    })
    @Property()
    public familienname!: string;

    @AutoMap()
    @Index({
        name: 'person_vorname_trgm_index',
        expression: 'create index "person_vorname_trgm_index" on "person" using gin ("vorname" gin_trgm_ops);',
    })
    @Property()
    public vorname!: string;

    @ManyToOne({ nullable: true })
    public dataProvider?: DataProviderEntity;

    @AutoMap()
    @Property({ nullable: false, default: '1' })
    public revision!: string;

    @AutoMap()
    @Index({
        name: 'person_personalnummer_unique',
        expression: 'create unique index "person_personalnummer_unique" on "person" ("personalnummer") nulls distinct;',
    })
    @Index({
        name: 'person_personalnummer_trgm_index',
        expression:
            'create index "person_personalnummer_trgm_index" on "person" using gin ("personalnummer" gin_trgm_ops);',
    })
    @Property({ nullable: true })
    public personalnummer?: string;

    @OneToMany({
        entity: () => PersonenkontextEntity,
        mappedBy: 'personId',
    })
    public personenKontexte: Collection<PersonenkontextEntity> = new Collection<PersonenkontextEntity>(this);

    @OneToMany({
        entity: () => EmailAddressEntity,
        mappedBy: 'personId',
        cascade: [],
        orphanRemoval: false,
        eager: true,
        orderBy: { updatedAt: QueryOrder.desc },
    })
    public emailAddresses: Collection<EmailAddressEntity> = new Collection<EmailAddressEntity>(this);

    @AutoMap()
    @Property({ nullable: true, type: DateTimeType })
    public orgUnassignmentDate?: Date;

    @OneToMany({
        entity: () => UserLockEntity,
        mappedBy: 'person',
    })
    public userLocks: Collection<UserLockEntity> = new Collection<UserLockEntity>(this);

    @AutoMap()
    @Property({ nullable: false, default: false })
    public istTechnisch!: boolean;

    @OneToMany({
        entity: () => PersonExternalIdMappingEntity,
        mappedBy: 'person',
        orphanRemoval: true,
        eager: true, // Always populate this relation
    })
    public externalIds: Collection<PersonExternalIdMappingEntity> = new Collection<PersonExternalIdMappingEntity>(this);
}
