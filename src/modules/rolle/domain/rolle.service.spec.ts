import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DoFactory } from '../../../../test/utils/index.js';
import { ScopeOperator } from '../../../shared/persistence/scope.enums.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenArt } from './rolle.enums.js';
import { FindRollenWithPermissionsParams, RolleService } from './rolle.service.js';
import { RolleScope } from '../repo/rolle.scope.js';
import { QBFilterQuery } from '@mikro-orm/core';
import { RolleEntity } from '../entity/rolle.entity.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from './rolle.js';

function validateUsedScopeWithParams(
    scopeUsed: RolleScope,
    params: Omit<FindRollenWithPermissionsParams, 'permissions'>,
): void {
    expect(scopeUsed).toBeInstanceOf(RolleScope);
    expect(scopeUsed['scopeWhereOperator']).toEqual(ScopeOperator.AND);
    if (params.rollenArten) {
        expect(scopeUsed['queryFilters']).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rollenart: { $in: params.rollenArten },
                } as QBFilterQuery<RolleEntity>),
            ]),
        );
    }
    if (params.organisationIds) {
        expect(scopeUsed['queryFilters']).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    administeredBySchulstrukturknoten: { $in: params.organisationIds },
                } as QBFilterQuery<RolleEntity>),
            ]),
        );
    }
    if (params.searchStr) {
        expect(scopeUsed['queryFilters']).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    $or: [
                        {
                            name: { $ilike: `%${params.searchStr}%` },
                        } as QBFilterQuery<RolleEntity>,
                    ],
                }),
            ]),
        );
    }
    expect(scopeUsed['offset']).toEqual(params.offset);
    expect(scopeUsed['limit']).toEqual(params.limit);
}

describe('RolleService', () => {
    let module: TestingModule;
    let rolleService: RolleService;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleService,
                {
                    provide: RolleRepo,
                    useValue: createMock(RolleRepo),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock(OrganisationRepository),
                },
            ],
        }).compile();
        rolleService = module.get(RolleService);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(rolleService).toBeDefined();
    });

    describe('findRollenAvailableForErweiterung', () => {
        let permissionsMock: DeepMocked<PersonPermissions>;
        beforeEach(() => {
            permissionsMock = createMock(PersonPermissions);
        });

        it('should return empty array if no permitted orgas', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            const result: Counted<Rolle<true>> = await rolleService.findRollenAvailableForErweiterung({
                permissions: permissionsMock,
            });
            expect(result).toEqual([[], 0]);
        });

        it('should call rolleRepo.findBy with correct scope', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                rollenArten: [RollenArt.SYSADMIN],
                limit: 10,
                offset: 0,
            };
            await rolleService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenCalled();
            const scopeUsed: RolleScope = rolleRepoMock.findBy.mock.calls[0]![0];
            validateUsedScopeWithParams(scopeUsed, params);
        });

        it('should filter by permitted orgas and requested orgas', async () => {
            const allowedOrgas: Array<Organisation<true>> = DoFactory.createMany(3, true, DoFactory.createOrganisation);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: allowedOrgas.map((o: Organisation<true>) => o.id),
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                organisationIds: allowedOrgas.slice(1).map((o: Organisation<true>) => o.id),
            };
            await rolleService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenCalled();
            const scopeUsed: RolleScope = rolleRepoMock.findBy.mock.calls[0]![0];
            validateUsedScopeWithParams(scopeUsed, params);
        });

        it('should filter by permitted orgas if no orgas are requested', async () => {
            const allowedOrgas: Array<Organisation<true>> = DoFactory.createMany(3, true, DoFactory.createOrganisation);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: allowedOrgas.map((o: Organisation<true>) => o.id),
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
            };
            await rolleService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenCalled();
            const scopeUsed: RolleScope = rolleRepoMock.findBy.mock.calls[0]![0];
            expect(scopeUsed['queryFilters']).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        administeredBySchulstrukturknoten: { $in: allowedOrgas.map((o: Organisation<true>) => o.id) },
                    } as QBFilterQuery<RolleEntity>),
                ]),
            );
        });

        it('should return empty array if filtered organisationenIds is empty', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: ['orga-1'] });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                organisationIds: ['orga-2'],
            };
            const result: Counted<Rolle<true>> = await rolleService.findRollenAvailableForErweiterung(params);
            expect(result).toEqual([[], 0]);
            expect(rolleRepoMock.findBy).not.toHaveBeenCalled();
        });

        it('should filter by searchStr if provided', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                searchStr: 'test',
            };
            await rolleService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenCalled();
            const scopeUsed: RolleScope = rolleRepoMock.findBy.mock.calls[0]![0];
            validateUsedScopeWithParams(scopeUsed, params);
        });
    });

    describe('getOrganisationIdsWithParents', () => {
        it('should return organisationIds with parents', async () => {
            const orgaIds: OrganisationID[] = ['orga-1', 'orga-2'];
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([
                DoFactory.createOrganisation(true, { id: 'parent-1' }),
            ]);
            const result: OrganisationID[] = await rolleService['getOrganisationIdsWithParents'](orgaIds);
            expect(result).toEqual(expect.arrayContaining(['orga-1', 'orga-2', 'parent-1']));
        });
    });
});
