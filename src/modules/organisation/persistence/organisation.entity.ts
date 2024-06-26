import { AutoMap } from '@automapper/classes';
import { Entity, Enum, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';

@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @AutoMap()
    @Property({ columnType: 'uuid', nullable: true })
    public administriertVon?: string;

    @AutoMap()
    @Property({ columnType: 'uuid', nullable: true })
    public zugehoerigZu?: string;

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
    @Enum({ items: () => OrganisationsTyp, nullable: true, nativeEnumName: 'organisations_typ_enum' })
    public typ?: OrganisationsTyp;

    @AutoMap(() => String)
    @Enum({ items: () => Traegerschaft, nullable: true, nativeEnumName: 'traegerschaft_enum' })
    public traegerschaft?: Traegerschaft;
}
