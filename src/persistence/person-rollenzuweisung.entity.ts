import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { RolleEntity } from './rolle.entity.js';
import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';

@Entity({ tableName: 'person_rollenzuweisung' })
export class PersonRollenzuweisungEntity extends TimestampedEntity<PersonRollenzuweisungEntity, 'id'> {
    @ManyToOne()
    public person!: PersonEntity;

    @ManyToOne()
    public role!: RolleEntity;

    @ManyToOne()
    public schoolStructureNode!: SchulstrukturknotenEntity;
}
