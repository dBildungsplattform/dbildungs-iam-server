import { AutoMap } from '@automapper/classes';
import { BaseEntity, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

@Entity({ tableName: 'organisation' })
export class OrganisationEntity extends BaseEntity<OrganisationEntity, 'id'> {
    public constructor() {
        super();
    }

    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

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
