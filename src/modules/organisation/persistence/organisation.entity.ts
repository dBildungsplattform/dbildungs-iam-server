import { AutoMap } from '@automapper/classes';
import { Entity, Enum, Property } from '@mikro-orm/core';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends TimestampedEntity<OrganisationEntity, 'id'> {
    public constructor() {
        super();
    }

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

    @AutoMap()
    @Enum({ items: () => OrganisationsTyp, nullable: true })
    public typ?: OrganisationsTyp;
}
