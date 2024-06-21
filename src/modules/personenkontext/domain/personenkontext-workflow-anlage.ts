import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { RolleNurAnPassendeOrganisationError } from '../specification/error/rolle-nur-an-passende-organisation.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';

export class PersonenkontextWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleId?: string;

    public personenkontextId?: string | null;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepo: OrganisationRepo,
        dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
    ): PersonenkontextWorkflowAggregate {
        return new PersonenkontextWorkflowAggregate(rolleRepo, organisationRepo, dbiamPersonenkontextFactory);
    }

    // Initialize the aggregate with the selected Organisation and Rolle
    public initialize(ssk?: string, rolle?: string, pkId?: string): void {
        this.selectedOrganisationId = ssk;
        this.selectedRolleId = rolle;
        this.personenkontextId = pkId ?? null;
    }

    // Finds all SSKs that the admin can see
    public async findAllSchulstrukturknoten(
        permissions: PersonPermissions,
        organisationName: string | undefined,
        limit?: number,
    ): Promise<OrganisationDo<true>[]> {
        let allOrganisations: OrganisationDo<boolean>[] = [];
        // If the search string for organisation is present then search for Name or Kennung
        if (organisationName) {
            allOrganisations = await this.organisationRepo.findByNameOrKennung(organisationName);
        }
        // Otherwise just retrieve all orgas
        allOrganisations = await this.organisationRepo.find(limit);
        const orgsWithRecht: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        // Return only the orgas that the admin have rights on
        return allOrganisations.filter((orga: OrganisationDo<boolean>) =>
            orgsWithRecht.includes(orga.id as OrganisationID),
        );
    }

    public async findRollenForOrganisation(
        permissions: PersonPermissions,
        organisationId: string,
        rolleName?: string,
        limit?: number,
    ): Promise<Rolle<true>[]> {
        let rollen: Option<Rolle<true>[]>;

        if (rolleName) {
            rollen = await this.rolleRepo.findByName(rolleName, limit);
        } else {
            rollen = await this.rolleRepo.find(limit);
        }

        if (!rollen) {
            return [];
        }

        // Retrieve all organisations that the admin has access to
        const orgsWithRecht: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        if (!orgsWithRecht || orgsWithRecht.length === 0) {
            return [];
        }

        // The organisation that was selected and that will be the base for the returned roles
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(organisationId);
        if (!organisation) {
            return [];
        }

        // Filter roles based on the organization's administeredBySchulstrukturKnoten
        const allowedRollen: Rolle<true>[] = rollen.filter(
            (rolle: Rolle<true>) => rolle.administeredBySchulstrukturknoten === organisation.id,
        );

        // If the user has rights for this specific organization, return the filtered roles
        if (orgsWithRecht.includes(organisation.id)) {
            return allowedRollen;
        }

        // Otherwise, return an empty array as the user doesn't have permission to view these roles
        return [];
    }

    // Verifies if the selected rolle and organisation can together be assigned to a kontext
    // Also verifies again if the organisationId is allowed to be assigned by the admin
    public async canCommit(permissions: PersonPermissions, organisationId: string, rolleId: string): Promise<boolean> {
        const referenceCheckError: Option<DomainError> = await this.checkReferences(organisationId, rolleId);
        if (referenceCheckError) {
            return false;
        }

        const permissionCheckError: Option<DomainError> = await this.checkPermissions(permissions, organisationId);
        if (permissionCheckError) {
            return false;
        }

        return true;
    }

    // Takes in the list of personenkontexte and decides whether to add or delete the personenkontexte for a specific PersonId
    // This will only be used during "bearbeiten".
    public async commit(
        personId: string,
        lastModified: Date,
        count: number,
        personenkontexte: DbiamPersonenkontextBodyParams[],
    ): Promise<Personenkontext<true>[] | PersonenkontexteUpdateError> {
        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            personId,
            lastModified,
            count,
            personenkontexte,
        );
        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();

        return updateResult;
    }

    // Checks if the rolle can be assigned to the target organisation
    public async checkReferences(organisationId: string, rolleId: string): Promise<Option<DomainError>> {
        const [orga, rolle]: [Option<OrganisationDo<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepo.findById(organisationId),
            this.rolleRepo.findById(rolleId),
        ]);

        if (!orga) {
            return new EntityNotFoundError('Organisation', organisationId);
        }

        if (!rolle) {
            return new EntityNotFoundError('Rolle', rolleId);
        }

        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('Rolle', rolleId); // Rolle does not exist for the chosen organisation
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new RolleNurAnPassendeOrganisationError();
        }

        return undefined;
    }

    public async checkPermissions(
        permissions: PersonPermissions,
        organisationId: string,
    ): Promise<Option<DomainError>> {
        // Check if logged in person has permission
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(organisationId, [
            RollenSystemRecht.PERSONEN_VERWALTEN,
        ]);

        // Missing permission on orga
        if (!hasPermissionAtOrga) {
            return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
        }

        return undefined;
    }

    public async findSchulstrukturknoten(
        rolleId: string,
        sskName: string,
        limit?: number,
        excludeKlassen: boolean = false,
    ): Promise<OrganisationDo<true>[]> {
        this.selectedRolleId = rolleId;

        const ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByNameOrKennung(sskName);
        if (ssks.length === 0) return [];

        const rolleResult: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
        if (!rolleResult) return [];

        const allOrganisations: OrganisationDo<true>[] = [];

        const parentOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            rolleResult.administeredBySchulstrukturknoten,
        );
        if (!parentOrganisation) return [];
        allOrganisations.push(parentOrganisation);

        const childOrganisations: OrganisationDo<true>[] = await this.organisationRepo.findChildOrgasForIds([
            rolleResult.administeredBySchulstrukturknoten,
        ]);
        allOrganisations.push(...childOrganisations);

        let orgas: OrganisationDo<true>[] = ssks.filter((ssk: OrganisationDo<true>) =>
            allOrganisations.some((organisation: OrganisationDo<true>) => ssk.id === organisation.id),
        );

        if (excludeKlassen) {
            orgas = orgas.filter((ssk: OrganisationDo<true>) => ssk.typ !== OrganisationsTyp.KLASSE);
        }

        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        orgas = orgas.filter((orga: OrganisationDo<true>) =>
            organisationMatchesRollenart.isSatisfiedBy(orga, rolleResult),
        );

        return orgas.slice(0, limit);
    }

    public async findAuthorizedRollen(
        permissions: PersonPermissions,
        rolleName?: string,
        limit?: number,
    ): Promise<Rolle<true>[]> {
        let rollen: Option<Rolle<true>[]>;

        if (rolleName) {
            rollen = await this.rolleRepo.findByName(rolleName, limit);
        } else {
            rollen = await this.rolleRepo.find(limit);
        }

        if (!rollen) return [];

        const orgsWithRecht: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        //Landesadmin can view all roles.
        if (orgsWithRecht.includes(this.organisationRepo.ROOT_ORGANISATION_ID)) return rollen;

        const allowedRollen: Rolle<true>[] = [];
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        (await this.organisationRepo.findByIds(orgsWithRecht)).forEach(function (orga: OrganisationDo<true>) {
            rollen.forEach(function (rolle: Rolle<true>) {
                if (organisationMatchesRollenart.isSatisfiedBy(orga, rolle) && !allowedRollen.includes(rolle)) {
                    allowedRollen.push(rolle);
                }
            });
        });

        return allowedRollen;
    }
}
