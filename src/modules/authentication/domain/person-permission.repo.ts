import { Injectable } from '@nestjs/common';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { KeycloakUserNotFoundError } from './keycloak-user-not-found.error.js';
import { PersonPermissions } from './person-permissions.js';

@Injectable()
export class PersonPermissionsRepo {
    public constructor(
        private readonly personRepo: PersonRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rollenRepo: RolleRepo,
    ) {}

    public async loadPersonPermissions(keycloakUserId: string): Promise<PersonPermissions> {
        const person: Option<Person<true>> = await this.personRepo.findByKeycloakUserId(keycloakUserId);
        if (!person) {
            throw new KeycloakUserNotFoundError();
        }

        return new PersonPermissions(this.personenkontextRepo, this.organisationRepo, this.rollenRepo, person);
    }
}
