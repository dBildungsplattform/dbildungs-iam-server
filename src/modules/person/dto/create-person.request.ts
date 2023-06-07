import { PersonEntity } from '../person.entity.js';

export class CreatePersonRequest {
    public toPersonEntity(): PersonEntity {
        throw new Error();
    }
}
