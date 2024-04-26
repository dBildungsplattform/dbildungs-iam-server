import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { PersonScope } from '../persistence/person.scope.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Person } from './person.js';
import { OrganisationID } from '../../../shared/types/index.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DataConfig, ServerConfig } from '../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PersonUc {
    public readonly ROOT_ORGANISATION_ID: string;

    public constructor(
        private readonly personRepository: PersonRepository,
        config: ConfigService<ServerConfig>,
    ) {
        this.ROOT_ORGANISATION_ID = config.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;
    }

    public async getPersonIfAllowed(personId: string, permissions: PersonPermissions): Promise<Result<Person<true>>> {
        // Find all organisations where user has permission
        let organisationIDs: OrganisationID[] | undefined = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        // Check if user has permission on root organisation
        if (organisationIDs?.includes(this.ROOT_ORGANISATION_ID)) {
            organisationIDs = undefined;
        }

        // Find all Personen on child-orgas (+root orgas)
        const scope: PersonScope = new PersonScope()
            .findBy({ organisationen: organisationIDs })
            .sortBy('vorname', ScopeOrder.ASC);

        const [persons]: Counted<Person<true>> = await this.personRepository.findBy(scope);

        const person: Person<true> | undefined = persons.find((p: Person<true>) => p.id === personId);

        if (!person) return { ok: false, error: new EntityNotFoundError('Person') };

        return { ok: true, value: person };
    }
}
