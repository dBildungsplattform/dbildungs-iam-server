import { PersonEntity } from '../../../modules/person/persistence/person.entity.js';

export class PersonFile extends PersonEntity {
    public seedId?: number;

    public username?: string;

    public password?: string;
}
