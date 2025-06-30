import { ConfigService } from '@nestjs/config';
import { PortalConfig } from '../../../shared/config/portal.config.js';
import { mapStringsToRollenArt } from '../../../shared/config/utils.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { RolleID } from '../../../shared/types/index.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontextWorkflowSharedKernel } from './personenkontext-workflow-shared-kernel.js';
import { OperationContext } from './personenkontext.enums.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';

export class PersonenkontextWorkflowAggregate {
    public selectedOrganisationId?: string;

    public selectedRolleIds?: string[];

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly configService: ConfigService,
        private readonly personenkontextWorkflowSharedKernel: PersonenkontextWorkflowSharedKernel,
    ) {}

    public static createNew(
        rolleRepo: RolleRepo,
        organisationRepository: OrganisationRepository,
        dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        configService: ConfigService,
        personenkontextWorkflowSharedKernel: PersonenkontextWorkflowSharedKernel,
    ): PersonenkontextWorkflowAggregate {
        return new PersonenkontextWorkflowAggregate(
            rolleRepo,
            organisationRepository,
            dbiamPersonenkontextFactory,
            configService,
            personenkontextWorkflowSharedKernel,
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
        rollenIds?: string[],
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

        const organisation: Option<Organisation<true>> = await this.organisationRepository.findById(
            this.selectedOrganisationId,
        );
        if (!organisation) {
            return [];
        }

        // Fetch all roles by name or all
        const rollen: Rolle<true>[] = rolleName
            ? await this.rolleRepo.findByName(rolleName, false, undefined, undefined, rollenarten)
            : await this.rolleRepo.find(false, undefined, undefined, rollenarten);

        if (rollen.length === 0) {
            return [];
        }

        // Check which roles are allowed for the organisation
        const allowedRollen: Rolle<true>[] = (
            await Promise.all(
                rollen.map(async (rolle: Rolle<true>) => {
                    const error: Option<DomainError> = await this.checkReferences(organisation.id, rolle.id);
                    return error ? null : rolle;
                }),
            )
        ).filter((rolle: Rolle<true> | null): rolle is Rolle<true> => rolle !== null);

        // Fetch explicitly selected Rollen by ID, if provided
        let selectedRollen: Rolle<true>[] = [];
        if (rollenIds?.length) {
            selectedRollen = Array.from((await this.rolleRepo.findByIds(rollenIds)).values());
        }

        // Merge and deduplicate by ID
        const allRollenMap: Map<string, Rolle<true>> = new Map<string, Rolle<true>>();
        [...allowedRollen, ...selectedRollen].forEach((rolle: Rolle<true>) => {
            allRollenMap.set(rolle.id, rolle);
        });

        // Sort by name
        let finalRollen: Rolle<true>[] = Array.from(allRollenMap.values()).sort((a: Rolle<true>, b: Rolle<true>) =>
            a.name.localeCompare(b.name, 'de', { numeric: true }),
        );

        // Apply limit, but ensure selectedRollen are always present
        if (limit) {
            const selectedIdsSet: Set<string> = new Set(rollenIds);
            const guaranteedSelected: Rolle<true>[] = finalRollen.filter((r: Rolle<true>) => selectedIdsSet.has(r.id));
            const otherRollen: Rolle<true>[] = finalRollen
                .filter((r: Rolle<true>) => !selectedIdsSet.has(r.id))
                .slice(0, Math.max(limit - guaranteedSelected.length, 0));
            finalRollen = [...guaranteedSelected, ...otherRollen];
        }

        return finalRollen;
    }

    // Verifies if the selected rolle and organisation can together be assigned to a kontext
    // Also verifies again if the organisationId is allowed to be assigned by the admin
    public async canCommit(
        permissions: PersonPermissions,
        operationContext: OperationContext,
    ): Promise<DomainError | boolean> {
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
                operationContext,
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
        return this.personenkontextWorkflowSharedKernel.checkReferences(organisationId, rolleId);
    }

    public async checkPermissions(
        permissions: PersonPermissions,
        organisationId: string,
        rolleIds: RolleID[],
        operationContext: OperationContext,
    ): Promise<Option<DomainError>> {
        if (operationContext === OperationContext.PERSON_ANLEGEN) {
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
        } else if (operationContext === OperationContext.PERSON_BEARBEITEN) {
            const hasVerwaltenPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(
                organisationId,
                RollenSystemRecht.PERSONEN_VERWALTEN,
            );
            if (hasVerwaltenPermissionAtOrga) return;
        }

        return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
    }
}
