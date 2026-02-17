import { Test, TestingModule } from '@nestjs/testing';
import { uniq } from 'lodash-es';

import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DoFactory } from '../../../../test/utils/index.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleFindByParameters, RolleRepo } from '../repo/rolle.repo.js';
import { FindRollenWithPermissionsParams, RolleFindService } from './rolle-find.service.js';
import { RollenArt } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { OrganisationMatchesRollenart } from './specification/organisation-matches-rollenart.js';

describe('RolleService', () => {
    let module: TestingModule;
    let rolleFindService: RolleFindService;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleFindService,
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
        rolleFindService = module.get(RolleFindService);
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
        expect(rolleFindService).toBeDefined();
    });

    describe('findRollenAvailableForErweiterung', () => {
        let permissionsMock: DeepMocked<PersonPermissions>;
        beforeEach(() => {
            permissionsMock = createMock(PersonPermissions);
        });

        it('should return empty array if no permitted orgas', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForErweiterung({
                permissions: permissionsMock,
            });
            expect(result).toEqual([[], 0]);
        });

        it('should call rolleRepo.findBy with correct query', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                rollenArten: [RollenArt.SYSADMIN],
                limit: 10,
                offset: 0,
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchStr: params.searchStr,
                    allowedOrganisationIds: undefined,
                    limit: params.limit,
                    offset: params.offset,
                    rollenArten: params.rollenArten,
                }),
            );
        });

        it('should filter by permitted orgas and requested orgas', async () => {
            const allowedOrgas: Array<Organisation<true>> = DoFactory.createMany(3, true, DoFactory.createOrganisation);
            const requestedOrgas: Organisation<true>[] = allowedOrgas.slice(1);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: allowedOrgas.map((o: Organisation<true>) => o.id),
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findDistinctOrganisationsTypen.mockImplementationOnce((orgaIds: OrganisationID[]) => {
                const s: Set<OrganisationsTyp> = new Set();
                allowedOrgas.forEach((o: Organisation<true>) => {
                    if (orgaIds.includes(o.id)) {
                        s.add(o.typ!);
                    }
                });
                return Promise.resolve(Array.from(s));
            });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                organisationIds: requestedOrgas.map((o: Organisation<true>) => o.id),
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);

            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    allowedOrganisationIds: expect.arrayContaining(
                        requestedOrgas.map((o: Organisation<true>) => o.id),
                    ) as Array<OrganisationID>,
                    rollenArten: expect.arrayContaining(
                        uniq(
                            requestedOrgas
                                .map((o: Organisation<true>) =>
                                    OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(o.typ!),
                                )
                                .flatMap((set: Set<RollenArt>) => Array.from(set)),
                        ),
                    ) as Array<RollenArt>,
                } as Partial<RolleFindByParameters>),
            );
        });

        it('should filter by permitted orgas if no orgas are requested', async () => {
            const allowedOrgas: Array<Organisation<true>> = DoFactory.createMany(3, true, DoFactory.createOrganisation);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: allowedOrgas.map((o: Organisation<true>) => o.id),
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findDistinctOrganisationsTypen.mockImplementationOnce((orgaIds: OrganisationID[]) => {
                const s: Set<OrganisationsTyp> = new Set();
                allowedOrgas.forEach((o: Organisation<true>) => {
                    if (orgaIds.includes(o.id)) {
                        s.add(o.typ!);
                    }
                });
                return Promise.resolve(Array.from(s));
            });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    allowedOrganisationIds: expect.arrayContaining(
                        allowedOrgas.map((o: Organisation<true>) => o.id),
                    ) as Array<OrganisationID>,
                    rollenArten: expect.arrayContaining(
                        uniq(
                            allowedOrgas
                                .map((o: Organisation<true>) =>
                                    OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(o.typ!),
                                )
                                .flatMap((set: Set<RollenArt>) => Array.from(set)),
                        ),
                    ) as Array<RollenArt>,
                } as Partial<RolleFindByParameters>),
            );
        });

        it('should narrow allowed rollenarten if requested', async () => {
            const allowedOrgas: Array<Organisation<true>> = [
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.ROOT }),
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.KLASSE }),
                DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SONSTIGE }),
            ];
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: allowedOrgas.map((o: Organisation<true>) => o.id),
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findDistinctOrganisationsTypen.mockImplementationOnce((orgaIds: OrganisationID[]) => {
                const s: Set<OrganisationsTyp> = new Set();
                allowedOrgas.forEach((o: Organisation<true>) => {
                    if (orgaIds.includes(o.id)) {
                        s.add(o.typ!);
                    }
                });
                return Promise.resolve(Array.from(s));
            });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                rollenArten: [RollenArt.SYSADMIN],
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    allowedOrganisationIds: expect.arrayContaining(
                        allowedOrgas.map((o: Organisation<true>) => o.id),
                    ) as Array<OrganisationID>,
                    rollenArten: expect.arrayContaining([RollenArt.SYSADMIN]) as Array<RollenArt>,
                } as Partial<RolleFindByParameters>),
            );
        });

        it('should return empty array if filtered organisationenIds is empty', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: ['orga-1'] });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                organisationIds: ['orga-2'],
            };
            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(result).toEqual([[], 0]);
            expect(rolleRepoMock.findBy).not.toHaveBeenCalled();
        });

        it('should filter by searchStr if provided', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                searchStr: 'test',
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchStr: params.searchStr,
                } as Partial<RolleFindByParameters>),
            );
        });
    });

    describe('getOrganisationIdsWithParents', () => {
        it('should return organisationIds with parents', async () => {
            const orgaIds: OrganisationID[] = ['orga-1', 'orga-2'];
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([
                DoFactory.createOrganisation(true, { id: 'parent-1' }),
            ]);
            const result: OrganisationID[] = await rolleFindService['getOrganisationIdsWithParents'](orgaIds);
            expect(result).toEqual(expect.arrayContaining(['orga-1', 'orga-2', 'parent-1']));
        });
    });
});
