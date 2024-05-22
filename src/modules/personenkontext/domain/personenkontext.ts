import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        private readonly rolleRepo: RolleRepo,
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        rolleRepo: RolleRepo,
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(rolleRepo, id, createdAt, updatedAt, personId, organisationId, rolleId);
    }

    public static createNew(
        rolleRepo: RolleRepo,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<false> {
        return new Personenkontext(rolleRepo, undefined, undefined, undefined, personId, organisationId, rolleId);
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

    public async checkValidity(permissions: PersonPermissions): Promise<Option<DomainError>> {
        // Check if logged in person has permission
        {
            const hasPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(this.organisationId, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            // Missing permission on orga
            if (!hasPermissionAtOrga) {
                return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
            }
        }

        // Can rolle be assigned at target orga
        {
            const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(this.rolleId);
            if (!rolle) {
                return new EntityNotFoundError('rolle', this.rolleId);
            }

            const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(this.organisationId);
            if (!canAssignRolle) {
                return new EntityNotFoundError(''); // TODO: Can't assign rolle at this organisation error
            }
        }

        // Check if logged in user can modify target person
        {
            const canModifyPerson: boolean = await permissions.canModifyPerson(this.personId);

            if (!canModifyPerson) {
                return new MissingPermissionsError('Not authorized to manage this person');
            }
        }

        return undefined;
    }
}
