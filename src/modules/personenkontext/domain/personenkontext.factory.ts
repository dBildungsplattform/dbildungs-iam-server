import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { Personenkontext } from './personenkontext.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class PersonenkontextFactory {
    public constructor(
        private rolleRepo: RolleRepo,
        private organisationRepo: OrganisationRepo,
        private personRepo: PersonRepo,
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

    public async createNew(
        personId: string,
        organisationId: string,
        rolleId: string,
    ): Promise<Personenkontext<false> | DomainError> {
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
