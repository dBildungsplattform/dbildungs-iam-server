import { PersonRollenZuweisungEntity } from '../../modules/rolle/entity/person-rollen-zuweisung.entity.js';
import { Entity } from '@mikro-orm/core';
import { Reference } from './db-seed.types.js';

@Entity()
export class PersonRollenZuweisungEntityFile extends PersonRollenZuweisungEntity {
    public rolleReference!: Reference;
}
