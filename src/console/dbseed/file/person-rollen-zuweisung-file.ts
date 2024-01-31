import { PersonRollenZuweisungEntity } from '../../../modules/rolle/entity/person-rollen-zuweisung.entity.js';
import { Reference } from '../db-seed.console.js';

export class PersonRollenZuweisungFile extends PersonRollenZuweisungEntity {
    public rolleReference!: Reference;
}
