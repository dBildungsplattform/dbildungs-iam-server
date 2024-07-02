import { Injectable } from '@nestjs/common';
import { PersonPermissions } from './person-permissions.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { KeycloakUserNotFoundError } from './keycloak-user-not-found.error.js';

@Injectable()
export class PersonPermissionsRepo {
    public constructor(
        private personRepo: PersonRepository,
        private personenkontextRepo: DBiamPersonenkontextRepo,
        private organisationRepo: OrganisationRepository,
        private rollenRepo: RolleRepo,
    ) {}

    public async loadPersonPermissions(keycloakUserId: string): Promise<PersonPermissions> {
        const person: Option<Person<true>> = await this.personRepo.findByKeycloakUserId(keycloakUserId);
        if (!person) {
            throw new KeycloakUserNotFoundError();
        }

        return new PersonPermissions(this.personenkontextRepo, this.organisationRepo, this.rollenRepo, person);
    }
}
