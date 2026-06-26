import { vi } from 'vitest';
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
import { RollenSystemRecht } from './systemrecht.js';
import { Ok } from '../../../shared/util/result.js';

type RolleFindServiceTestAccess = {
    getOrganisationIdsWithParents(organisationIds: OrganisationID[]): Promise<OrganisationID[]>;
};

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
                expect.objectContaining<RolleFindByParameters>({
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
                }),
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
                expect.objectContaining<RolleFindByParameters>({
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
                }),
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
                expect.objectContaining<RolleFindByParameters>({
                    allowedOrganisationIds: expect.arrayContaining<OrganisationID>(
                        allowedOrgas.map((o: Organisation<true>) => o.id),
                    ) as Array<OrganisationID>,
                    rollenArten: expect.arrayContaining([RollenArt.SYSADMIN]) as Array<RollenArt>,
                }),
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

        it('should return empty array if allowed organisationIds and rollenarten do not match', async () => {
            const schule: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [schule.id],
            });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findDistinctOrganisationsTypen.mockResolvedValueOnce([OrganisationsTyp.SCHULE]);

            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                rollenArten: [RollenArt.SYSADMIN],
                organisationIds: [schule.id],
            };

            await rolleFindService.findRollenAvailableForErweiterung(params);

            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining<RolleFindByParameters>({
                    allowedOrganisationIds: [schule.id],
                    rollenArten: [],
                }),
            );
        });

        it('should filter by searchStr if provided', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const params: FindRollenWithPermissionsParams = {
                permissions: permissionsMock,
                searchStr: 'test',
            };
            await rolleFindService.findRollenAvailableForErweiterung(params);
            expect(rolleRepoMock.findBy).toHaveBeenLastCalledWith(
                expect.objectContaining<RolleFindByParameters>({
                    searchStr: params.searchStr,
                }),
            );
        });
    });

    describe('findRollenAvailableForImportPersonenkontext', () => {
        let permissionsMock: DeepMocked<PersonPermissions>;
        beforeEach(() => {
            permissionsMock = createMock(PersonPermissions);
        });

        it('should return empty array if no permitted orgas', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
            });

            expect(result).toEqual([[], 0]);
            expect(permissionsMock.getOrgIdsWithSystemrecht).toHaveBeenCalledWith(
                [RollenSystemRecht.IMPORT_DURCHFUEHREN],
                true,
                false,
            );
        });

        it('should return empty array when no orgas are requested', async () => {
            const organisationId: OrganisationID = 'orga-1';
            const candidateRolle: Rolle<true> = DoFactory.createRolle(true);

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisationId] });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findByIds.mockResolvedValue(new Map());
            rolleRepoMock.findBy.mockResolvedValue([[candidateRolle], 1]);

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
            });

            expect(result).toEqual([[], 0]);
        });

        it('should return empty array if requested organisationIds are not permitted', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: ['orga-1'] });

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
                organisationIds: ['orga-2'],
            });

            expect(result).toEqual([[], 0]);
            expect(rolleRepoMock.findBy).not.toHaveBeenCalled();
        });

        it('should return empty array if allowed organisationIds resolve to empty', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: ['orga-1'] });
            vi.spyOn(
                rolleFindService as unknown as RolleFindServiceTestAccess,
                'getOrganisationIdsWithParents',
            ).mockResolvedValueOnce([]);

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
            });

            expect(result).toEqual([[], 0]);
            expect(rolleRepoMock.findBy).not.toHaveBeenCalled();
        });

        it('should apply offset and limit after filtering candidates', async () => {
            const rollen: Rolle<true>[] = [
                DoFactory.createRolle(true, { name: 'A' }),
                DoFactory.createRolle(true, { name: 'B' }),
                DoFactory.createRolle(true, { name: 'C' }),
            ];
            vi.spyOn(rollen[0] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());
            vi.spyOn(rollen[1] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());
            vi.spyOn(rollen[2] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            rolleRepoMock.findBy.mockResolvedValue([rollen, rollen.length]);
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const orgaMap: Map<OrganisationID, Organisation<true>> = new Map<OrganisationID, Organisation<true>>([
                ['orga-1', DoFactory.createOrganisation(true, { id: 'orga-1', typ: OrganisationsTyp.SCHULE })],
            ]);
            organisationRepoMock.findByIds.mockResolvedValue(orgaMap);

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
                organisationIds: ['orga-1'],
                offset: 1,
                limit: 1,
            });

            expect(result).toEqual([[rollen[1]], rollen.length]);
        });

        it('should apply offset when no limit is provided', async () => {
            const rollen: Rolle<true>[] = [
                DoFactory.createRolle(true, { name: 'A' }),
                DoFactory.createRolle(true, { name: 'B' }),
                DoFactory.createRolle(true, { name: 'C' }),
            ];
            vi.spyOn(rollen[0] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());
            vi.spyOn(rollen[1] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());
            vi.spyOn(rollen[2] as unknown as Rolle<true>, 'canBeAssignedToOrga').mockResolvedValue(Ok());

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            rolleRepoMock.findBy.mockResolvedValue([rollen, rollen.length]);
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            const orgaMap: Map<OrganisationID, Organisation<true>> = new Map<OrganisationID, Organisation<true>>([
                ['orga-1', DoFactory.createOrganisation(true, { id: 'orga-1', typ: OrganisationsTyp.SCHULE })],
            ]);
            organisationRepoMock.findByIds.mockResolvedValue(orgaMap);

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
                organisationIds: ['orga-1'],
                offset: 1,
            });

            expect(result).toEqual([rollen.slice(1), rollen.length]);
        });

        it('should filter out rollen that cannot be assigned to requested organisation', async () => {
            const organisationId: OrganisationID = 'orga-1';
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                id: organisationId,
                typ: OrganisationsTyp.SCHULE,
            });

            const allowedRolle: Rolle<true> = DoFactory.createRolle(true, {
                administeredBySchulstrukturknoten: organisationId,
                rollenart: RollenArt.LEHR,
            });
            const disallowedRolle: Rolle<true> = DoFactory.createRolle(true, {
                administeredBySchulstrukturknoten: organisationId,
                rollenart: RollenArt.SYSADMIN,
            });

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisationId] });
            organisationRepoMock.findParentOrgasForIds.mockResolvedValue([]);
            organisationRepoMock.findByIds.mockResolvedValue(new Map([[organisationId, organisation]]));
            rolleRepoMock.findBy.mockResolvedValue([[allowedRolle, disallowedRolle], 2]);

            const result: Counted<Rolle<true>> = await rolleFindService.findRollenAvailableForImportPersonenkontext({
                permissions: permissionsMock,
                organisationIds: [organisationId],
            });

            expect(result[0]).toHaveLength(1);
            expect(result[0]).toEqual([allowedRolle]);
            expect(result[1]).toBe(1);
            expect(permissionsMock.getOrgIdsWithSystemrecht).toHaveBeenCalledWith(
                [RollenSystemRecht.IMPORT_DURCHFUEHREN],
                true,
                false,
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
