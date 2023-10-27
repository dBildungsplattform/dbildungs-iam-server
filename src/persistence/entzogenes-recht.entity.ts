import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolleRechtEntity } from '../modules/rolle/entity/rolle-recht.entity.js';

@Entity({ tableName: 'entzogenes_recht' })
export class EntzogenesRechtEntity extends TimestampedEntity<EntzogenesRechtEntity, 'id'> {
    public constructor() {
        super();
    }

    @Property()
    public name!: string;

    /**
     * Links to Person
     */
    @Property()
    public person!: string;

    @ManyToOne()
    public permission!: RolleRechtEntity;
}
