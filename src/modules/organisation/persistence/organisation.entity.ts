import { AutoMap } from '@automapper/classes';
import { BigIntType, Entity, Enum, Index, ManyToOne, Opt, Property, Ref } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';

@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @ManyToOne({
        fieldName: 'administriert_von',
        columnType: 'uuid',
        ref: true,
        nullable: true,
        index: false,
        entity: () => OrganisationEntity,
    })
    @Index({ name: 'organisation_administriert_von_index' })
    public administriertVon?: Ref<OrganisationEntity>;

    @ManyToOne({
        fieldName: 'zugehoerig_zu',
        columnType: 'uuid',
        ref: true,
        nullable: true,
        entity: () => OrganisationEntity,
    })
    public zugehoerigZu?: Ref<OrganisationEntity>;

    @AutoMap()
    @Property({ nullable: true })
    public kennung?: string;

    @AutoMap()
    @Property({ nullable: true })
    public name?: string;

    @AutoMap()
    @Property({ nullable: true })
    public namensergaenzung?: string;

    @AutoMap()
    @Property({ nullable: true })
    public kuerzel?: string;

    @AutoMap(() => String)
    @Index({ name: 'organisation_typ_index' })
    @Enum({ items: () => OrganisationsTyp, nullable: true, nativeEnumName: 'organisations_typ_enum' })
    public typ?: OrganisationsTyp;

    @AutoMap(() => String)
    @Enum({ items: () => Traegerschaft, nullable: true, nativeEnumName: 'traegerschaft_enum' })
    public traegerschaft?: Traegerschaft;

    @Property({ nullable: true })
    public emailDomain?: string;

    @Property({ nullable: true })
    public emailAddress?: string;

    @Property({ default: false })
    public itslearningEnabled!: boolean;

    @Property({ type: new BigIntType('number'), defaultRaw: '1', concurrencyCheck: true })
    public version!: number & Opt;
}
