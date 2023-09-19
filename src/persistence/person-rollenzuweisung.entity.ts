import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';

@Entity({ tableName: 'person_rollenzuweisung' })
export class PersonRollenzuweisungEntity extends TimestampedEntity<PersonRollenzuweisungEntity, 'id'> {
    /**
     * Links to Person
     */
    @Property()
    public person!: string;

    @ManyToOne()
    public role!: RolleEntity;

    /**
     * Points to Schulstrukturknoten
     */
    @Property()
    public schoolStructureNode!: string;
}
