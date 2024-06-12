import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonenkontextAnlageError } from '../../../shared/error/personenkontext-anlage.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';

export type PersonenkontextPartial = Pick<
    Personenkontext<boolean>,
    'id' | 'createdAt' | 'updatedAt' | 'personId' | 'organisationId' | 'rolleId'
>;

export function mapAggregateToPartial(personenkontext: Personenkontext<boolean>): PersonenkontextPartial {
    return {
        id: personenkontext.id,
        createdAt: personenkontext.createdAt,
        updatedAt: personenkontext.updatedAt,
        personId: personenkontext.personId,
        organisationId: personenkontext.organisationId,
        rolleId: personenkontext.rolleId,
    };
}

export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        private readonly personRepo: PersonRepository,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        public id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: PersonID,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        personRepo: PersonRepository,
        organisationRepo: OrganisationRepository,
        rolleRepo: RolleRepo,
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(
            personRepo,
            organisationRepo,
            rolleRepo,
            id,
            createdAt,
            updatedAt,
            personId,
            organisationId,
            rolleId,
        );
    }

    public static createNew(
        personRepo: PersonRepository,
        organisationRepo: OrganisationRepository,
        rolleRepo: RolleRepo,
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): Personenkontext<false> {
        return new Personenkontext(
            personRepo,
            organisationRepo,
            rolleRepo,
            undefined,
            undefined,
            undefined,
            personId,
            organisationId,
            rolleId,
        );
    }

    public async checkReferences(): Promise<Option<DomainError>> {
        const [personExists, orga, rolle]: [boolean, Option<Organisation<true>>, Option<Rolle<true>>] =
            await Promise.all([
                this.personRepo.exists(this.personId),
                this.organisationRepo.findById(this.organisationId),
                this.rolleRepo.findById(this.rolleId),
            ]);

        if (!personExists) {
            return new EntityNotFoundError('Person', this.personId);
        }

        if (!orga) {
            return new EntityNotFoundError('Organisation', this.organisationId);
        }

        if (!rolle) {
            return new EntityNotFoundError('Rolle', this.rolleId);
        }

        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(this.organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('rolle', this.rolleId); // Rolle does not exist for the chosen organisation
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new PersonenkontextAnlageError(
                'PersonenkontextAnlage invalid: role type does not match organisation type',
            );
        }

        return undefined;
    }

    public async checkReferencesForNonExistentUser(): Promise<Option<DomainError>> {
        const [orga, rolle]: [Option<Organisation<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepo.findById(this.organisationId),
            this.rolleRepo.findById(this.rolleId),
        ]);

        if (!orga) {
            return new EntityNotFoundError('Organisation', this.organisationId);
        }

        if (!rolle) {
            return new EntityNotFoundError('Rolle', this.rolleId);
        }

        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(this.organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('rolle', this.rolleId); // Rolle does not exist for the chosen organisation
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new PersonenkontextAnlageError(
                'PersonenkontextAnlage invalid: role type does not match organisation type',
            );
        }

        return undefined;
    }

    public async checkPermissions(permissions: PersonPermissions): Promise<Option<DomainError>> {
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
