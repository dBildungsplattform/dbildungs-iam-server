import { Injectable } from '@nestjs/common';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Personenkontext } from './personenkontext.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

@Injectable()
export class PersonenkontextFactory {
    public constructor(private readonly rolleRepo: RolleRepo) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return Personenkontext.construct(this.rolleRepo, id, createdAt, updatedAt, personId, organisationId, rolleId);
    }

    public createNew(personId: PersonID, organisationId: OrganisationID, rolleId: RolleID): Personenkontext<false> {
        return Personenkontext.createNew(this.rolleRepo, personId, organisationId, rolleId);
    }
}
