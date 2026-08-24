import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { intersection } from 'lodash-es';
import { ServerConfig } from '../../../shared/config/index.js';
import { PortalConfig } from '../../../shared/config/portal.config.js';
import { mapStringsToRollenArt } from '../../../shared/config/utils.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { intersectPermittedAndRequestedOrgas, PermittedOrgas } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import {
    FindRollenAvailableForPersonenkontextCreationParams,
    RolleFindByParameters,
    RolleRepo,
} from '../repo/rolle.repo.js';
import { RollenArt, RollenMerkmal } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { OrganisationMatchesRollenart } from './specification/organisation-matches-rollenart.js';
import { RollenSystemRecht } from './systemrecht.js';

export interface FindRollenWithPermissionsParams {
    permissions: IPersonPermissions;
    searchStr?: string;
    organisationIds?: Array<OrganisationID>;
    rollenArten?: Array<RollenArt>;
    limit?: number;
    offset?: number;
}

export interface FindRollenForPersonenkontextCreationWithPermissionsParams {
    permissions: IPersonPermissions;
    systemrecht: RollenSystemRecht;
    organisationId: OrganisationID;
    rollenartOfUser?: RollenArt;
    rolleName?: string;
    rollenIds?: Array<RolleID>;
    limit?: number;
    offset?: number;
}

type OrganisationBounds =
    | {
          selectedAndPermittedOrgas: Array<OrganisationID>;
          selectedAndPermittedOrgasWithParents: Array<OrganisationID>;
          kind: 'bounded';
      }
    | { kind: 'unbouded' }
    | { kind: 'empty' };

interface FindRollenForPersonenImportParams {
    permissions: IPersonPermissions;
    organisationId: OrganisationID;
    rollenArten?: Array<RollenArt>;
    searchStr?: string;
    limit?: number;
    offset?: number;
}

type FindRollenAvailableForErweiterungParams = FindRollenWithPermissionsParams & {
    requestedSystemrechte?: RollenSystemRecht[];
};

type FindRollenAvailableForPersonAdministrationParams = FindRollenWithPermissionsParams & {
    requestedSystemrechte?: RollenSystemRecht[];
};

@Injectable()
export class RolleFindService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly configService: ConfigService<ServerConfig>,
    ) {}

    public async findRollenAvailableForErweiterung(
        params: FindRollenAvailableForErweiterungParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            params.requestedSystemrechte ?? [RollenSystemRecht.ROLLEN_ERWEITERN],
            true,
        );
        const wantsMptRollen: boolean =
            params.requestedSystemrechte?.includes(RollenSystemRecht.MPT_ROLLEN_VERWALTEN) ?? false;

        const organisationBounds: OrganisationBounds = await this.resolveOrganisationBounds(
            permittedOrgas,
            params.organisationIds,
        );

        const queryParams: RolleFindByParameters = {
            searchStr: params.searchStr,
            limit: params.limit,
            offset: params.offset,
        };

        switch (organisationBounds.kind) {
            case 'bounded':
                queryParams.allowedOrganisationIds = organisationBounds.selectedAndPermittedOrgasWithParents;
                queryParams.rollenArten = await this.resolveAllowedRollenArten(
                    organisationBounds.selectedAndPermittedOrgas,
                    params.rollenArten,
                );
                if (
                    !(
                        wantsMptRollen &&
                        (await this.hasMPTRollenVerwaltenPermission(
                            params.permissions,
                            organisationBounds.selectedAndPermittedOrgas,
                        ))
                    )
                ) {
                    queryParams.excludeMerkmale = [RollenMerkmal.MPT_ROLLE];
                }
                break;
            case 'unbouded':
                queryParams.allowedOrganisationIds = undefined;
                queryParams.rollenArten = params.rollenArten;
                if (!(wantsMptRollen && (await this.hasMPTRollenVerwaltenPermission(params.permissions)))) {
                    queryParams.excludeMerkmale = [RollenMerkmal.MPT_ROLLE];
                }
                break;
            case 'empty':
                return [[], 0];
        }

        return this.rolleRepo.findBy(queryParams);
    }

    public async findRollenAvailableForImportPersonenkontext(
        params: FindRollenForPersonenImportParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.IMPORT_DURCHFUEHREN],
            true,
            false,
        );

        const query: RolleFindByParameters = {
            searchStr: params.searchStr,
            excludeMerkmale: [RollenMerkmal.MPT_ROLLE],
            limit: params.limit,
            offset: params.offset,
        };

        const organisationBounds: OrganisationBounds = await this.resolveOrganisationBounds(permittedOrgas, [
            params.organisationId,
        ]);
        if (organisationBounds.kind === 'bounded') {
            query.allowedOrganisationIds = organisationBounds.selectedAndPermittedOrgasWithParents;
            query.rollenArten = await this.resolveAllowedRollenArten(
                organisationBounds.selectedAndPermittedOrgas,
                params.rollenArten,
            );
        } else {
            return [[], 0];
        }

        return this.rolleRepo.findBy(query);
    }

    public async findRollenAvailableForPersonenkontextCreation(
        params: FindRollenForPersonenkontextCreationWithPermissionsParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht([params.systemrecht]);
        const organisationBounds: OrganisationBounds = await this.resolveOrganisationBounds(permittedOrgas, [
            params.organisationId,
        ]);
        if (organisationBounds.kind !== 'bounded') {
            return [[], 0];
        }

        const [allowedRollenarten, allowedRollenartenForMPTRollen]: [Array<RollenArt>, Array<RollenArt>] =
            await this.getAllowedRollenArtenForPersonenkontextCreation(
                params,
                organisationBounds.selectedAndPermittedOrgas,
            );
        if (allowedRollenartenForMPTRollen.length === 0) {
            return [[], 0];
        }

        const query: FindRollenAvailableForPersonenkontextCreationParams = {
            organisationId: params.organisationId,
            allowedRollenarten,
            allowedOrganisationIds: organisationBounds.selectedAndPermittedOrgasWithParents,
            stickyRollenIds: params.rollenIds,
            limit: params.limit,
            offset: params.offset,
            searchStr: params.rolleName,
        };

        const hasMPTPermission: boolean = await params.permissions.hasSystemrechtAtOrganisation(
            params.organisationId,
            RollenSystemRecht.MPT_ROLLEN_VERWALTEN,
        );
        if (hasMPTPermission) {
            query.mpt = {
                allowedRollenarten: allowedRollenartenForMPTRollen,
            };
        }

        return this.rolleRepo.findRollenAvailableForPersonenkontextCreation(query);
    }

    public async findRollenAvailableForPersonAdministration(
        params: FindRollenAvailableForPersonAdministrationParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            params.requestedSystemrechte ?? [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
            true,
        );

        const queryParams: RolleFindByParameters = {
            searchStr: params.searchStr,
            limit: params.limit,
            offset: params.offset,
        };

        const wantsMptRollen: boolean =
            params.requestedSystemrechte?.includes(RollenSystemRecht.MPT_ROLLEN_VERWALTEN) ?? false;

        const organisationBounds: OrganisationBounds = await this.resolveOrganisationBounds(
            permittedOrgas,
            params.organisationIds,
        );
        switch (organisationBounds.kind) {
            case 'bounded':
                queryParams.allowedOrganisationIds = organisationBounds.selectedAndPermittedOrgasWithParents;
                queryParams.rollenArten = await this.resolveAllowedRollenArten(
                    organisationBounds.selectedAndPermittedOrgas,
                );
                if (
                    !(
                        wantsMptRollen &&
                        (await this.hasMPTRollenVerwaltenPermission(
                            params.permissions,
                            organisationBounds.selectedAndPermittedOrgas,
                        ))
                    )
                ) {
                    queryParams.excludeMerkmale = [RollenMerkmal.MPT_ROLLE];
                }
                break;
            case 'unbouded':
                if (!wantsMptRollen) {
                    queryParams.excludeMerkmale = [RollenMerkmal.MPT_ROLLE];
                }
                break;
            case 'empty':
                return [[], 0];
        }

        return this.rolleRepo.findBy(queryParams);
    }

    public async findMptRollenAuthorized(
        permissions: IPersonPermissions,
        includeTechnische: boolean,
        searchStr?: string,
        limit?: number,
        offset?: number,
        organisationIds?: OrganisationID[],
        rolleIds?: RolleID[],
    ): Promise<Counted<Rolle<true>>> {
        const orgIdsWithRecht: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.MPT_ROLLEN_VERWALTEN],
            true,
        );

        // Narrow the requested organisation IDs using the allowed organisations
        let filteredRequestedOrgaIds: OrganisationID[] | undefined;
        if (organisationIds && organisationIds.length > 0) {
            filteredRequestedOrgaIds = intersectPermittedAndRequestedOrgas(orgIdsWithRecht, organisationIds);
        } else if (!orgIdsWithRecht.all) {
            filteredRequestedOrgaIds = orgIdsWithRecht.orgaIds;
        }

        if (filteredRequestedOrgaIds && filteredRequestedOrgaIds.length === 0) {
            return [[], 0];
        }

        let allowedOrganisationIds: OrganisationID[] | undefined = filteredRequestedOrgaIds;
        let rollenartFilter: RollenArt[] | undefined;
        if (filteredRequestedOrgaIds) {
            const [orgaTypes, orgaIdsWithParents]: [OrganisationsTyp[], OrganisationID[]] = await Promise.all([
                this.organisationRepository.findDistinctOrganisationsTypen(filteredRequestedOrgaIds),
                this.getOrganisationIdsWithParents(filteredRequestedOrgaIds),
            ]);

            // Get organisations to create rollenart filter
            rollenartFilter = Array.from(
                OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationTypes(orgaTypes),
            );

            // Set allowed orgas
            allowedOrganisationIds = orgaIdsWithParents;
        }

        return this.rolleRepo.findBy({
            includeTechnische,
            searchStr,
            limit,
            offset,
            allowedOrganisationIds,
            rolleIds,
            requireMerkmale: [RollenMerkmal.MPT_ROLLE],
            orderBy: 'artAndName',
            rollenArten: rollenartFilter,
        });
    }

    /**
     * Returns two arrays of allowed rollenarten based on parameters. The latter is the more general one, while the first may be narrowed based on users permissions and LIMITED_ROLLENART_ALLOWLIST
     * @param params
     * @param organisation
     * @returns [allowedRollenarten, allowedRollenartenForMPTRollen]
     */
    private async getAllowedRollenArtenForPersonenkontextCreation(
        params: FindRollenForPersonenkontextCreationWithPermissionsParams,
        selectedAndPermittedOrgas: Array<OrganisationID>,
    ): Promise<[Array<RollenArt>, Array<RollenArt>]> {
        const rollenArtenForOrganisation: Array<RollenArt> = await this.resolveAllowedRollenArten(
            selectedAndPermittedOrgas,
            params.rollenartOfUser ? [params.rollenartOfUser] : undefined,
        );
        if (rollenArtenForOrganisation.length === 0) {
            return [[], []];
        }

        if (params.systemrecht === RollenSystemRecht.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN) {
            const rollenArtenFromAllowList: Array<RollenArt> = this.getLimitedRollenarten();
            const limitedRollenarten: Array<RollenArt> = intersection(
                rollenArtenForOrganisation,
                rollenArtenFromAllowList,
            );
            return [limitedRollenarten, rollenArtenForOrganisation];
        } else {
            return [rollenArtenForOrganisation, rollenArtenForOrganisation];
        }
    }

    private async resolveAllowedRollenArten(
        orgaIds: Array<OrganisationID>,
        selectedRollenArten?: Array<RollenArt>,
    ): Promise<Array<RollenArt>> {
        const distinctOrganisationsTypen: Array<OrganisationsTyp> =
            await this.organisationRepository.findDistinctOrganisationsTypen(orgaIds);
        const rollenArtenForOrganisationen: Array<RollenArt> =
            this.mapOrganisationsTypenToRollenArten(distinctOrganisationsTypen);
        if (selectedRollenArten && selectedRollenArten.length > 0) {
            return intersection(rollenArtenForOrganisationen, selectedRollenArten);
        }
        return rollenArtenForOrganisationen;
    }

    private getLimitedRollenarten(): Array<RollenArt> {
        const portalConfig: PortalConfig = this.configService.getOrThrow<PortalConfig>('PORTAL');
        return mapStringsToRollenArt(portalConfig.LIMITED_ROLLENART_ALLOWLIST ?? []);
    }

    private async resolveOrganisationBounds(
        permittedOrgas: PermittedOrgas,
        selectedOrgas?: Array<OrganisationID>,
    ): Promise<OrganisationBounds> {
        if (selectedOrgas) {
            const narrowedSelection: OrganisationID[] = intersectPermittedAndRequestedOrgas(
                permittedOrgas,
                selectedOrgas,
            );
            if (narrowedSelection.length === 0) {
                return { kind: 'empty' };
            }

            const selectedOrgasWithParents: OrganisationID[] =
                await this.getOrganisationIdsWithParents(narrowedSelection);
            if (selectedOrgasWithParents.length === 0) {
                return { kind: 'empty' };
            }

            return {
                selectedAndPermittedOrgas: narrowedSelection,
                selectedAndPermittedOrgasWithParents: selectedOrgasWithParents,
                kind: 'bounded',
            };
        } else {
            if (permittedOrgas.all) {
                return { kind: 'unbouded' };
            }

            const selectedOrgasWithParents: OrganisationID[] = await this.getOrganisationIdsWithParents(
                permittedOrgas.orgaIds,
            );
            if (selectedOrgasWithParents.length === 0) {
                return { kind: 'empty' };
            }

            return {
                selectedAndPermittedOrgas: permittedOrgas.orgaIds,
                selectedAndPermittedOrgasWithParents: selectedOrgasWithParents,
                kind: 'bounded',
            };
        }
    }

    private async getOrganisationIdsWithParents(organisationIds: OrganisationID[]): Promise<OrganisationID[]> {
        if (organisationIds.length === 0) {
            return [];
        }

        const organisationIdsWithParents: Set<OrganisationID> = new Set(organisationIds);

        const parents: Organisation<true>[] = await this.organisationRepository.findParentOrgasForIds(organisationIds);
        for (const parent of parents) {
            organisationIdsWithParents.add(parent.id);
        }

        return Array.from(organisationIdsWithParents);
    }

    private mapOrganisationsTypenToRollenArten(organisationenTypen: OrganisationsTyp[]): RollenArt[] {
        const rollenArten: Set<RollenArt> = new Set();
        for (const organisationsTyp of organisationenTypen) {
            const allowedRollenArtenForOrganisationsTyp: Set<RollenArt> =
                OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(organisationsTyp);
            for (const rollenArt of allowedRollenArtenForOrganisationsTyp) {
                rollenArten.add(rollenArt);
            }
        }
        return Array.from(rollenArten);
    }

    private async hasMPTRollenVerwaltenPermission(
        permissions: IPersonPermissions,
        organisationIds?: Array<OrganisationID>,
    ): Promise<boolean> {
        if (organisationIds) {
            const individualOrgaPermissions: boolean[] = await Promise.all(
                organisationIds.map((orga: OrganisationID) =>
                    permissions.hasSystemrechtAtOrganisation(orga, RollenSystemRecht.MPT_ROLLEN_VERWALTEN),
                ),
            );
            return individualOrgaPermissions.every(Boolean);
        } else {
            return permissions.hasSystemrechteAtRootOrganisation([RollenSystemRecht.MPT_ROLLEN_VERWALTEN]);
        }
    }
}
