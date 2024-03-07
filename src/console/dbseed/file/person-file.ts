import { PersonEntity } from '../../../modules/person/persistence/person.entity.js';

export class PersonFile extends PersonEntity {
    public username?: string;

    public password?: string;
}
