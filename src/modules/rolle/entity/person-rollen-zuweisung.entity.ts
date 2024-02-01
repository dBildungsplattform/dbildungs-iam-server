import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';
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
    @Property({ nullable: false })
    public rolle!: string;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property({ nullable: false })
    public schulstrukturknoten!: string;
}
