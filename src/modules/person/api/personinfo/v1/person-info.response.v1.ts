import { PersonenkontextResponse } from '../../../../personenkontext/api/response/personenkontext.response.js';
import { Person } from '../../../domain/person.js';
import { PersonEmailResponse } from '../../person-email-response.js';
import { PersonInfoResponse, PersonNestedInPersonInfoResponse } from '../person-info.response.js';

export class PersonInfoResponseV1 extends PersonInfoResponse {
    public static override createNew(
        person: Person<true>,
        kontexte: PersonenkontextResponse[],
        dienststellen: string[],
        email: PersonEmailResponse | undefined,
    ): PersonInfoResponseV1 {
        const nestedPerson: PersonNestedInPersonInfoResponse = PersonNestedInPersonInfoResponse.createNew(
            person,
            dienststellen,
        );
        return new PersonInfoResponseV1(person.id, kontexte, email, nestedPerson);
    }
}
