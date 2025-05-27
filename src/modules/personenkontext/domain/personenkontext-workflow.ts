import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { RolleNurAnPassendeOrganisationError } from '../specification/error/rolle-nur-an-passende-organisation.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { RolleID } from '../../../shared/types/index.js';
import { ConfigService } from '@nestjs/config';
import { PortalConfig } from '../../../shared/config/portal.config.js';
import { mapStringsToRollenArt } from '../../../shared/config/utils.js';

export class PersonenkontextWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleIds?: string[];

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly configService: ConfigService,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
        dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        configService: ConfigService,
    ): PersonenkontextWorkflowAggregate {
        return new PersonenkontextWorkflowAggregate(
            rolleRepo,
            organisationRepository,
            dbiamPersonenkontextFactory,
            configService,
        );
    }

    // Initialize the aggregate with the selected Organisation and Rolle
    public initialize(organisationId?: string, rolleIds?: string[]): void {
        this.selectedOrganisationId = organisationId;
        this.selectedRolleIds = rolleIds;
    }

    // Finds all SSKs that the admin can see
    public async findAllSchulstrukturknoten(
        permissions: PersonPermissions,
        organisationName: string | undefined,
        organisationId?: string, // Add organisationId as an optional parameter
        limit?: number,
    ): Promise<Organisation<true>[]> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        // If there are no permitted orgas, return an empty array early
        if (!permittedOrgas.all && permittedOrgas.orgaIds.length === 0) return [];

        let allOrganisationsExceptKlassen: Organisation<true>[] = [];

        // Fetch organisations based on the permitted organization IDs and the search string
        allOrganisationsExceptKlassen =
            await this.organisationRepository.findByNameOrKennungAndExcludeByOrganisationType(
                OrganisationsTyp.KLASSE,
                organisationName,
                permittedOrgas.all ? undefined : permittedOrgas.orgaIds, // Only fetch permitted organizations if restricted
                limit,
            );

        // If no organizations were found, return an empty array
        if (allOrganisationsExceptKlassen.length === 0) return [];

        // Return only the orgas that the admin have rights on
        let filteredOrganisations: Organisation<boolean>[] = allOrganisationsExceptKlassen.filter(
            (orga: Organisation<true>) => permittedOrgas.all || permittedOrgas.orgaIds.includes(orga.id),
        );

        // If organisationId is provided and it's not in the filtered results, fetch it explicitly
        if (
            this.selectedOrganisationId &&
            !filteredOrganisations.find((orga: Organisation<true>) => orga.id === organisationId)
        ) {
            const selectedOrg: Option<Organisation<true>> = await this.organisationRepository.findById(
                this.selectedOrganisationId,
            );
            if (selectedOrg) {
                filteredOrganisations = [selectedOrg, ...filteredOrganisations]; // Add the selected org at the beginning
            }
        }

        // Sort the filtered organizations, handling undefined kennung and name
        filteredOrganisations.sort((a: Organisation<boolean>, b: Organisation<boolean>) => {
            if (a.name && b.name) {
                const aTitle: string = a.kennung ? `${a.kennung} (${a.name})` : a.name;
                const bTitle: string = b.kennung ? `${b.kennung} (${b.name})` : b.name;
                return aTitle.localeCompare(bTitle, 'de', { numeric: true });
            }
            // Ensure a return value for cases where name is not defined (Should never happen normally)
            if (a.name) return -1;
            if (b.name) return 1;
            return 0;
        });

        // Return the organizations that the admin has rights to
        return filteredOrganisations;
    }

    public async findRollenForOrganisation(
        permissions: PersonPermissions,
        rolleName?: string,
        limit?: number,
        rollenarten?: RollenArt[],
    ): Promise<Rolle<true>[]> {
        if (
            !this.selectedOrganisationId ||
            !(await permissions.hasSystemrechteAtOrganisation(
                this.selectedOrganisationId,
                [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN],
                false,
            ))
        ) {
            return [];
        }

        let organisation: Option<Organisation<true>>;
        if (this.selectedOrganisationId) {
            // The organisation that was selected and that will be the base for the returned roles
            organisation = await this.organisationRepository.findById(this.selectedOrganisationId);
        }
        // If the organisation was not found with the provided selected Id then just return an array of empty orgas
        if (!organisation) {
            return [];
        }

        let rollen: Option<Rolle<true>[]>;

        if (rolleName) {
            rollen = await this.rolleRepo.findByName(rolleName, false, undefined, undefined, rollenarten);
        } else {
            rollen = await this.rolleRepo.find(false, undefined, undefined, rollenarten);
        }

        if (!rollen) {
            return [];
        }

        let allowedRollen: Rolle<true>[] = [];
        // If the user has rights for this specific organization or any of its children, return the filtered roles

        const allowedRollenPromises: Promise<Rolle<true> | null>[] = rollen.map(async (rolle: Rolle<true>) => {
            // Check if the rolle can be assigned to the target organisation
            const referenceCheckError: Option<DomainError> = await this.checkReferences(organisation.id, rolle.id);

            // If the reference check passes and the organisation matches the role type
            if (!referenceCheckError) {
                return rolle;
            }
            return null;
        });

        // Resolve all the promises and filter out any null values (roles that can't be assigned)
        const resolvedRollen: Rolle<true>[] = (await Promise.all(allowedRollenPromises)).filter(
            (rolle: Rolle<true> | null): rolle is Rolle<true> => rolle !== null,
        );

        allowedRollen = resolvedRollen;
        allowedRollen = allowedRollen.sort((a: Rolle<true>, b: Rolle<true>) =>
            a.name.localeCompare(b.name, 'de', { numeric: true }),
        );

        if (limit) {
            allowedRollen = allowedRollen.slice(0, limit);
        }

        // Sort the Roles by name
        return allowedRollen;
    }

    // Verifies if the selected rolle and organisation can together be assigned to a kontext
    // Also verifies again if the organisationId is allowed to be assigned by the admin
    public async canCommit(permissions: PersonPermissions): Promise<DomainError | boolean> {
        if (this.selectedOrganisationId && this.selectedRolleIds && this.selectedRolleIds.length > 0) {
            // Check references for all selected roles concurrently
            const referenceCheckErrors: Option<DomainError>[] = await Promise.all(
                this.selectedRolleIds.map((rolleId: string) =>
                    this.checkReferences(this.selectedOrganisationId!, rolleId),
                ),
            );

            // Find the first error if any
            const firstError: Option<DomainError> = referenceCheckErrors.find((error: Option<DomainError>) => error);
            if (firstError) {
                return firstError;
            }

            // Check permissions after verifying references
            const permissionCheckError: Option<DomainError> = await this.checkPermissions(
                permissions,
                this.selectedOrganisationId,
                this.selectedRolleIds,
            );
            if (permissionCheckError) {
                return permissionCheckError;
            }
        }

        return true;
    }

    // Takes in the list of personenkontexte and decides whether to add or delete the personenkontexte for a specific PersonId
    // This will only be used during "bearbeiten".
    public async commit(
        personId: string,
        lastModified: Date | undefined,
        count: number,
        personenkontexte: DbiamPersonenkontextBodyParams[],
        permissions: IPersonPermissions,
        personalnummer?: string,
    ): Promise<Personenkontext<true>[] | PersonenkontexteUpdateError> {
        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            personId,
            lastModified,
            count,
            personenkontexte,
            permissions,
            personalnummer,
        );
        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();

        if (updateResult instanceof PersonenkontexteUpdateError) {
            return updateResult;
        }
        return updateResult;
    }

    // Checks if the rolle can be assigned to the target organisation
    public async checkReferences(organisationId: string, rolleId: string): Promise<Option<DomainError>> {
        const [orga, rolle]: [Option<Organisation<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepository.findById(organisationId),
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
        rolleIds: RolleID[],
    ): Promise<Option<DomainError>> {
        // Check if logged in person has permission
        const hasAnlegenPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(
            organisationId,
            RollenSystemRecht.PERSONEN_ANLEGEN,
        );

        if (hasAnlegenPermissionAtOrga) {
            return undefined;
        }

        const hasLimitedCreationPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(
            organisationId,
            RollenSystemRecht.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN,
        );

        if (!hasLimitedCreationPermissionAtOrga) {
            return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
        }

        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rolleIds);

        const portalConfig: PortalConfig = this.configService.getOrThrow<PortalConfig>('PORTAL');

        const allowedRollenArten: RollenArt[] | undefined = mapStringsToRollenArt(
            portalConfig.LIMITED_ROLLENART_ALLOWLIST || [],
        );

        // Check if the selected roles match the allowed roles
        const isAllowed: boolean = Array.from(rollen.values()).every((rolle: Rolle<true>) =>
            allowedRollenArten?.includes(rolle.rollenart),
        );
        if (isAllowed) {
            return undefined;
        } else {
            return new MissingPermissionsError('Unauthorized to manage rollenart at the organisation');
        }
    }
}
