import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ tableName: 'entzogenes_recht' })
export class EntzogenesRechtEntity extends TimestampedEntity<EntzogenesRechtEntity, 'id'> {
    public constructor() {
        super();
    }

    @Property()
    public name!: string;

    @ManyToOne()
    public person!: PersonEntity;

    @ManyToOne()
    public permission!: RolleRechtEntity;
}
