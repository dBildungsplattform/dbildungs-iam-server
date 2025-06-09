import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { Err, Ok, UnionToResult } from '../../../shared/util/result.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonLandesbediensteterSearchService } from '../../person/person-landesbedienstete-search/person-landesbediensteter-search.service.js';
import { DbiamPersonenkontextBodyParams } from '../../personenkontext/api/param/dbiam-personenkontext.body.params.js';
import { DbiamPersonenkontextFactory } from '../../personenkontext/domain/dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontexteUpdate } from '../../personenkontext/domain/personenkontexte-update.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { OrganisationMatchesRollenart } from '../../personenkontext/specification/organisation-matches-rollenart.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';

export class LandesbediensteteWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleIds?: string[];

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly personRepo: PersonRepository,
        private readonly landesbediensteteSearchService: PersonLandesbediensteterSearchService,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
        personenkontextRepo: DBiamPersonenkontextRepo,
        dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        personRepo: PersonRepository,
        landesbediensteteSearchService: PersonLandesbediensteterSearchService,
    ): LandesbediensteteWorkflowAggregate {
        return new LandesbediensteteWorkflowAggregate(
            rolleRepo,
            organisationRepository,
            personenkontextRepo,
            dbiamPersonenkontextFactory,
            personRepo,
            landesbediensteteSearchService,
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
            [RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN],
            true,
        );

        // If there are no permitted orgas, return an empty array early
        if (!permittedOrgas.all && permittedOrgas.orgaIds.length === 0) return [];

        // Fetch organisations based on the permitted organization IDs and the search string
        const allOrganisationsExceptKlassen: Organisation<true>[] =
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
    ): Promise<Rolle<true>[]> {
        if (
            !this.selectedOrganisationId ||
            !(await permissions.hasSystemrechtAtOrganisation(
                this.selectedOrganisationId,
                RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN,
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

        let rollen: Rolle<true>[];

        if (rolleName) {
            rollen = await this.rolleRepo.findByName(rolleName, false);
        } else {
            rollen = await this.rolleRepo.find(false);
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
    public async canCommit(permissions: PersonPermissions): Promise<Result<void, DomainError>> {
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
                return Err(firstError);
            }

            // Check permissions after verifying references
            const permissionCheckError: Result<void, DomainError> = await this.checkPermissions(
                permissions,
                this.selectedOrganisationId,
            );

            if (!permissionCheckError.ok) return permissionCheckError;
        }

        return Ok(undefined);
    }

    // Takes in the list of personenkontexte and decides whether to add or delete the personenkontexte for a specific PersonId
    // This will only be used during "bearbeiten".
    public async commit(
        personId: string,
        lastModified: Date | undefined,
        count: number,
        newPersonenkontexte: DbiamPersonenkontextBodyParams[],
        permissions: IPersonPermissions,
        personalnummer?: string,
    ): Promise<Result<Personenkontext<true>[], DomainError>> {
        // Check permissions
        const hasSystemrecht: boolean = await Promise.all(
            newPersonenkontexte.map((pk: DbiamPersonenkontextBodyParams) =>
                permissions.hasSystemrechtAtOrganisation(
                    pk.organisationId,
                    RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN,
                ),
            ),
        ).then((checkResult: boolean[]) => checkResult.every(Boolean));

        if (!hasSystemrecht) {
            return Err(
                new MissingPermissionsError('Not allowed to add Landesbedienstete to the requested organisations.'),
            );
        }

        const person: Option<Person<true>> = await this.personRepo.findById(personId);
        if (!person) {
            return Err(new EntityNotFoundError('Person', personId));
        }

        const searchable: Result<void, DomainError> =
            await this.landesbediensteteSearchService.personIsSearchable(person);
        if (!searchable.ok) {
            return Err(new EntityNotFoundError('Person', personId));
        }

        // Construct permissions
        const permissionsOverride: IPersonPermissions = {
            canModifyPerson: (id: string) => Promise.resolve(id === personId), // Grant permission for that user
            hasSystemrechtAtOrganisation: permissions.hasSystemrechtAtOrganisation.bind(permissions), // Forward check to original permissions
            hasSystemrechteAtOrganisation: permissions.hasSystemrechteAtOrganisation.bind(permissions), // Forward check to original permissions
        };

        const existingPKs: DbiamPersonenkontextBodyParams[] = await this.personenkontextRepo.findByPerson(personId);

        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            personId,
            lastModified,
            count,
            existingPKs.concat(newPersonenkontexte),
            permissionsOverride,
            personalnummer,
        );
        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();

        return UnionToResult(updateResult);
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
    ): Promise<Result<void, DomainError>> {
        // Check if logged in person has permission
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechteAtOrganisation(organisationId, [
            RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN,
        ]);

        // Missing permission on orga
        if (!hasPermissionAtOrga) {
            return Err(new MissingPermissionsError('Unauthorized to add persons to the organisation'));
        }

        return Ok(undefined);
    }
}
