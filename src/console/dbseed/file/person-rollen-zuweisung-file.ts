import { PersonRollenZuweisungEntity } from '../../../modules/service-provider/entity/person-rollen-zuweisung.entity.js';
import { Reference } from '../db-seed.console.js';

export class PersonRollenZuweisungFile extends PersonRollenZuweisungEntity {
    public rolleReference!: Reference;
}
