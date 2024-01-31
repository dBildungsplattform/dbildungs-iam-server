import { AutoMap } from '@automapper/classes';
import { Entity, Enum, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends TimestampedEntity<OrganisationEntity, 'id'> {
    public constructor() {
        super();
    }

    @AutoMap()
    @ManyToOne(() => OrganisationEntity, { nullable: true })
    public verwaltetVon?: Ref<OrganisationEntity>;

    @AutoMap()
    @ManyToOne(() => OrganisationEntity, { nullable: true })
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
    @Enum({ items: () => OrganisationsTyp, nullable: true })
    public typ?: OrganisationsTyp;

    @AutoMap(() => String)
    @Enum({ items: () => Traegerschaft, nullable: true })
    public traegerschaft?: Traegerschaft;
}
