import { ApiProperty } from '@nestjs/swagger';
import { PersonResponse } from './person.response.js';
import { Person } from '../domain/person.js';
import { PersonNameParams } from './person-name.params.js';
import { UserLockParams } from '../../keycloak-administration/api/user-lock.params.js';
import { PersonEmailResponse } from './person-email-response.js';
import { UserLock } from '../../keycloak-administration/domain/user-lock.js';

export class PersonendatensatzResponse {
    @ApiProperty()
    public person!: PersonResponse;

    public constructor(person: Person<true>, withStartPasswort: boolean, personEmailResponse?: PersonEmailResponse) {
        const personResponseName: PersonNameParams = {
            familienname: person.familienname,
            vorname: person.vorname,
        };
        const userLockParams: UserLockParams[] = person.userLock.map((lock: UserLock) => ({
            personId: person.id,
            locked_by: lock.locked_by,
            locked_until: lock.locked_until?.toISOString(),
            lock_occasion: lock.locked_occasion,
            created_at: lock.created_at?.toISOString(),
        }));

        const personResponse: PersonResponse = {
            id: person.id,
            username: person.username,
            mandant: person.mandant,
            name: personResponseName,
            stammorganisation: person.stammorganisation,
            revision: person.revision,
            startpasswort: withStartPasswort === true ? person.newPassword : undefined,
            personalnummer: person.personalnummer,
            isLocked: person.isLocked,
            userLock: userLockParams,
            lastModified: person.updatedAt,
            email: personEmailResponse,
        };

        this.person = personResponse;
    }
}
