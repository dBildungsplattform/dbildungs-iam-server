import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Personenkontext } from './personenkontext.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

@Injectable()
export class PersonenkontextFactory {
    public constructor(
        private readonly personRepo: PersonRepository,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return Personenkontext.construct(
            this.personRepo,
            this.organisationRepo,
            this.rolleRepo,
            id,
            createdAt,
            updatedAt,
            personId,
            organisationId,
            rolleId,
        );
    }

    public createNew(personId: PersonID, organisationId: OrganisationID, rolleId: RolleID): Personenkontext<false> {
        return Personenkontext.createNew(
            this.personRepo,
            this.organisationRepo,
            this.rolleRepo,
            personId,
            organisationId,
            rolleId,
        );
    }
}
