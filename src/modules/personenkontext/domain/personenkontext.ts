import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(id, createdAt, updatedAt, personId, organisationId, rolleId);
    }

    public static createNew(
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<false> {
        return new Personenkontext(undefined, undefined, undefined, personId, organisationId, rolleId);
    }

    public async checkReferences(
        personRepo: PersonRepo,
        organisationRepo: OrganisationRepo,
        rolleRepo: RolleRepo,
    ): Promise<Option<DomainError>> {
        const referencesExist: [boolean, boolean, boolean] = await Promise.all([
            personRepo.exists(this.personId),
            organisationRepo.exists(this.organisationId),
            rolleRepo.exists(this.rolleId),
        ]);

        if (!referencesExist[0]) {
            return new EntityNotFoundError('Person', this.personId);
        }

        if (!referencesExist[1]) {
            return new EntityNotFoundError('Organisation', this.organisationId);
        }

        if (!referencesExist[2]) {
            return new EntityNotFoundError('Rolle', this.rolleId);
        }

        return undefined;
    }
}
