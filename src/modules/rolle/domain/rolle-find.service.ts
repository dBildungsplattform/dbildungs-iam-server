import { Injectable } from '@nestjs/common';
import { intersection } from 'lodash-es';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { intersectPermittedAndRequestedOrgas, PermittedOrgas } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleFindByParameters, RolleRepo } from '../repo/rolle.repo.js';
import { RollenArt } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { RollenSystemRecht } from './systemrecht.js';
import { OrganisationMatchesRollenart } from './specification/organisation-matches-rollenart.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';

export interface FindRollenWithPermissionsParams {
    permissions: IPersonPermissions;
    searchStr?: string;
    organisationIds?: Array<OrganisationID>;
    rollenArten?: Array<RollenArt>;
    limit?: number;
    offset?: number;
}

@Injectable()
export class RolleFindService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    public async findRollenAvailableForErweiterung(
        params: FindRollenWithPermissionsParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_ERWEITERN],
            true,
        );
        if (permittedOrgas.all === false && permittedOrgas.orgaIds.length === 0) {
            return [[], 0];
        }

        let permittedAndRequestedOrganisationenIds: OrganisationID[] | undefined;
        if (params.organisationIds && params.organisationIds.length > 0) {
            permittedAndRequestedOrganisationenIds = intersectPermittedAndRequestedOrgas(
                permittedOrgas,
                params.organisationIds,
            );
        } else if (permittedOrgas.all === false) {
            permittedAndRequestedOrganisationenIds = permittedOrgas.orgaIds;
        }

        let permittedAndRequestedOrganisationenIdsWithParents: OrganisationID[] | undefined;
        if (permittedAndRequestedOrganisationenIds !== undefined) {
            permittedAndRequestedOrganisationenIdsWithParents = await this.getOrganisationIdsWithParents(
                permittedAndRequestedOrganisationenIds,
            );
            if (permittedAndRequestedOrganisationenIdsWithParents.length === 0) {
                return [[], 0];
            }
        }

        const queryParams: RolleFindByParameters = {
            searchStr: params.searchStr,
            allowedOrganisationIds: permittedAndRequestedOrganisationenIdsWithParents,
            limit: params.limit,
            offset: params.offset,
        };

        if (permittedAndRequestedOrganisationenIds !== undefined && permittedAndRequestedOrganisationenIds.length > 0) {
            const organisationsTypen: OrganisationsTyp[] =
                await this.organisationRepository.findDistinctOrganisationsTypen(
                    permittedAndRequestedOrganisationenIds,
                );
            const rollenArtenForOrganisationsTypen: RollenArt[] =
                this.mapOrganisationsTypenToRollenArten(organisationsTypen);
            queryParams.rollenArten = params.rollenArten
                ? intersection(params.rollenArten, rollenArtenForOrganisationsTypen)
                : rollenArtenForOrganisationsTypen;
        } else {
            queryParams.rollenArten = params.rollenArten;
        }

        return this.rolleRepo.findBy(queryParams);
    }

    public async findRollenAvailableForImportPersonenkontext(
        params: FindRollenWithPermissionsParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.IMPORT_DURCHFUEHREN],
            true,
            false,
        );
        if (permittedOrgas.all === false && permittedOrgas.orgaIds.length === 0) {
            return [[], 0];
        }
        if (params.organisationIds === undefined || params.organisationIds.length === 0) {
            return [[], 0];
        }

        let organisationIdsWithParents: OrganisationID[] | undefined;

        if (permittedOrgas.all === true) {
            organisationIdsWithParents = await this.getOrganisationIdsWithParents(params.organisationIds);
        } else {
            const targetOrganisationIds: OrganisationID[] = intersectPermittedAndRequestedOrgas(
                permittedOrgas,
                params.organisationIds,
            );
            if (targetOrganisationIds.length === 0) {
                return [[], 0];
            }
            organisationIdsWithParents = await this.getOrganisationIdsWithParents(targetOrganisationIds);
        }

        if (organisationIdsWithParents === undefined || organisationIdsWithParents.length === 0) {
            return [[], 0];
        }

        const [candidateRollen]: Counted<Rolle<true>> = await this.rolleRepo.findBy({
            searchStr: params.searchStr,
            allowedOrganisationIds: organisationIdsWithParents,
            rollenArten: params.rollenArten,
        });

        const paramOrgas: Organisation<true>[] = Array.from(
            (await this.organisationRepository.findByIds(params.organisationIds ?? [])).values(),
        );

        let allowedRollen: Rolle<true>[] = (
            await Promise.all(
                candidateRollen.map(async (rolle: Rolle<true>) => {
                    const canBeAssignedToAnyTargetOrga: boolean = (
                        await Promise.all(
                            paramOrgas.map(async (organisation: Organisation<true>) => {
                                const canAssignResult: Result<void, Error> =
                                    await rolle.canBeAssignedToOrga(organisation);
                                return canAssignResult.ok;
                            }),
                        )
                    ).some(Boolean);

                    return canBeAssignedToAnyTargetOrga ? rolle : null;
                }),
            )
        ).filter((rolle: Rolle<true> | null): rolle is Rolle<true> => rolle !== null);

        const total: number = allowedRollen.length;
        const offset: number = params.offset ?? 0;
        const limit: number | undefined = params.limit;

        if (limit !== undefined) {
            allowedRollen = allowedRollen.slice(offset, offset + limit);
        } else if (offset > 0) {
            allowedRollen = allowedRollen.slice(offset);
        }

        return [allowedRollen, total];
    }

    private async getOrganisationIdsWithParents(organisationIds: OrganisationID[]): Promise<OrganisationID[]> {
        const organisationIdsWithParents: Set<OrganisationID> = new Set(organisationIds);
        const parents: Organisation<true>[] = await this.organisationRepository.findParentOrgasForIds(organisationIds);
        parents.forEach((parent: Organisation<true>) => organisationIdsWithParents.add(parent.id));
        return Array.from(organisationIdsWithParents);
    }

    private mapOrganisationsTypenToRollenArten(organisationenTypen: OrganisationsTyp[]): RollenArt[] {
        return Array.from(
            organisationenTypen.reduce<Set<RollenArt>>(
                (rollenArten: Set<RollenArt>, organisationsTyp: OrganisationsTyp) => {
                    OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(organisationsTyp).forEach(
                        (rollenart: RollenArt) => rollenArten.add(rollenart),
                    );
                    return rollenArten;
                },
                new Set<RollenArt>(),
            ),
        );
    }
}
