import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';
import { AutoMap } from '@automapper/classes';

@Entity({ tableName: 'person_rollenzuweisung' })
export class PersonRollenZuweisungEntity extends TimestampedEntity<PersonRollenZuweisungEntity, 'id'> {
    /**
     * Links to Person
     */
    @AutoMap()
    @Property({ nullable: false })
    public person!: string;

    @AutoMap()
    @ManyToOne()
    public role!: RolleEntity;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property({ nullable: false })
    public schoolStructureNode!: string;
}
