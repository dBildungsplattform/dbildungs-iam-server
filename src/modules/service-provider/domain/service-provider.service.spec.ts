import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { zip } from 'lodash-es';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { expectErrResult, expectOkResult } from '../../../../test/utils/test-types.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { VidisApiAdapter } from '../../vidis/adapter/domain/vidis-api.adapter.js';
import { UpdateServiceProviderBodyParams } from '../api/update-service-provider-body.params.js';
import { OrganisationServiceProviderRepo } from '../repo/organisation-service-provider.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderError } from '../specification/error/service-provider.error.js';
import { AttachedRollenError } from './errors/attached-rollen.error.js';
import { AttachedRollenerweiterungenError } from './errors/attached-rollenerweiterungen.error.js';
import { ServiceProviderKategorie, ServiceProviderMerkmal } from './service-provider.enum.js';
import { ServiceProvider } from './service-provider.js';
import { ServiceProviderService } from './service-provider.service.js';
import {
    ManageableServiceProviderDetailsWithReferencedObjects,
    ManageableServiceProviderWithReferencedObjects,
    RollenerweiterungForManageableServiceProvider,
} from './types.js';
import { DomainError } from '../../../shared/error/index.js';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
import { VidisServiceProviderImmutableError } from './errors/vidis-service-provider-immutable.error.js';

// helper to mock output of some repos
function getIdMap<T>(arr: Array<T & { id: string }>): Map<string, T> {
    const map: Map<string, T> = new Map();
    arr.forEach((value: T & { id: string }) => {
        map.set(value.id, value);
    });
    return map;
}

describe('ServiceProviderService', () => {
    let service: ServiceProviderService;
    let rolleRepo: DeepMocked<RolleRepo>;
    let rollenerweiterungRepo: DeepMocked<RollenerweiterungRepo>;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;
    let organisationRepo: DeepMocked<OrganisationRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                ServiceProviderService,
                { provide: RolleRepo, useValue: createMock(RolleRepo) },
                { provide: RollenerweiterungRepo, useValue: createMock(RollenerweiterungRepo) },
                { provide: ServiceProviderRepo, useValue: createMock(ServiceProviderRepo) },
                { provide: OrganisationRepository, useValue: createMock(OrganisationRepository) },
                { provide: VidisApiAdapter, useValue: createMock(VidisApiAdapter) },
                { provide: OrganisationServiceProviderRepo, useValue: createMock(OrganisationServiceProviderRepo) },
            ],
        }).compile();
        service = module.get<ServiceProviderService>(ServiceProviderService);
        rolleRepo = module.get<DeepMocked<RolleRepo>>(RolleRepo);
        rollenerweiterungRepo = module.get<DeepMocked<RollenerweiterungRepo>>(RollenerweiterungRepo);
        serviceProviderRepo = module.get<DeepMocked<ServiceProviderRepo>>(ServiceProviderRepo);
        organisationRepo = module.get<DeepMocked<OrganisationRepository>>(OrganisationRepository);
    });

    describe('getServiceProvidersByRolleIds', () => {
        const serviceProviders: Array<ServiceProvider<true>> = [
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
        ];
        const serviceProviderIds: Array<ServiceProvider<true>['id']> = serviceProviders.map(
            (sp: ServiceProvider<true>) => sp.id,
        );
        const rollen: Array<Rolle<true>> = [
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds.slice(0, 2) }),
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds.slice(2) }),
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds }),
        ];

        beforeEach(() => {
            rolleRepo.findById.mockImplementation((id: string) =>
                Promise.resolve(rollen.find((r: Rolle<true>) => r.id === id)),
            );
            rolleRepo.findByIds.mockImplementation((ids: Array<string>) => {
                return Promise.resolve(getIdMap(rollen.filter((r: Rolle<true>) => ids.includes(r.id))));
            });
            serviceProviderRepo.findById.mockImplementation((id: string) =>
                Promise.resolve(serviceProviders.find((sp: ServiceProvider<true>) => sp.id === id)),
            );
            serviceProviderRepo.findByIds.mockImplementation((ids: Array<string>) => {
                return Promise.resolve(
                    getIdMap(serviceProviders.filter((r: ServiceProvider<true>) => ids.includes(r.id))),
                );
            });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('returns serviceProviders', async () => {
            const result: Array<ServiceProvider<true>> = await service.getServiceProvidersByRolleIds(
                rollen.map((r: Rolle<true>) => r.id),
            );
            expect(result.length).toBe(serviceProviders.length);
            serviceProviders.forEach((expected: ServiceProvider<true>) => {
                const actual: Option<ServiceProvider<true>> = result.find(
                    (sp: ServiceProvider<true>) => sp.id === expected.id,
                );
                expect(actual).toBeDefined();
                expect(actual).toEqual<ServiceProvider<true>>(expected);
            });
        });

        it.each([[[] as Array<string>], [['non-existent']]])(
            'returns an empty array if ids are not found',
            async (ids: string[]) => {
                const result: Array<ServiceProvider<true>> = await service.getServiceProvidersByRolleIds(ids);
                expect(result.length).toBe(0);
            },
        );
    });

    describe('getServiceProvidersByOrganisationenAndRollen', () => {
        describe.each([[true], [false]])('when rollen have rollenerweiterungen', (haveRollenerweiterungen: boolean) => {
            const organisations: Array<Organisation<true>> = [
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
                DoFactory.createOrganisation(true),
            ];
            const serviceProviders: Array<ServiceProvider<true>> = [
                DoFactory.createServiceProvider(true),
                DoFactory.createServiceProvider(true),
                DoFactory.createServiceProvider(true),
                DoFactory.createServiceProvider(true),
                DoFactory.createServiceProvider(true),
            ];
            const rollen: Array<Rolle<true>> = serviceProviders.map((sp: ServiceProvider<true>) =>
                DoFactory.createRolle(true, { serviceProviderIds: [sp.id] }),
            );
            beforeEach(() => {
                rolleRepo.findByIds.mockImplementation((ids: Array<string>) => {
                    return Promise.resolve(getIdMap(rollen.filter((r: Rolle<true>) => ids.includes(r.id))));
                });
                rollenerweiterungRepo.findManyByOrganisationAndRolle.mockResolvedValue(
                    haveRollenerweiterungen
                        ? zip(organisations, rollen).map(
                              ([organisation, rolle]: [Organisation<true> | undefined, Rolle<true> | undefined]) =>
                                  DoFactory.createRollenerweiterung(true, {
                                      organisationId: organisation?.id,
                                      rolleId: rolle?.id,
                                  }),
                          )
                        : [],
                );
                serviceProviderRepo.findByIds.mockImplementation((ids: Array<string>) => {
                    return Promise.resolve(
                        getIdMap(ids.map((id: string) => DoFactory.createServiceProvider(true, { id }))),
                    );
                });
            });
            afterEach(() => {
                vi.restoreAllMocks();
            });
            it('returns a list of service providers', async () => {
                const result: Array<ServiceProvider<true>> = await service.getServiceProvidersByOrganisationenAndRollen(
                    zip(organisations, rollen).map(
                        ([o, r]: [Organisation<true> | undefined, Rolle<true> | undefined]) => ({
                            organisationId: o!.id,
                            rolleId: r!.id,
                        }),
                    ),
                );
                expect(result.length).toBe(
                    haveRollenerweiterungen ? organisations.length + serviceProviders.length : serviceProviders.length,
                );
            });
        });
    });

    describe('getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung', () => {
        let organisation: Organisation<true>;
        let serviceProvider: ServiceProvider<true>;
        let rollenerweiterung: Rollenerweiterung<true>;
        let rolle: Rolle<true>;

        beforeEach(() => {
            organisation = DoFactory.createOrganisation(true);
            serviceProvider = DoFactory.createServiceProvider(true, {
                providedOnSchulstrukturknoten: organisation.id,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });
            rollenerweiterung = DoFactory.createRollenerweiterung(true, {
                organisationId: organisation.id,
                serviceProviderId: serviceProvider.id,
            });
            rolle = DoFactory.createRolle(true, { serviceProviderIds: [serviceProvider.id] });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('throws MissingPermissionsError if person lacks required system rights', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.hasSystemrechtAtOrganisation = vi.fn().mockResolvedValue(false);

            const result: Result<
                Counted<ManageableServiceProviderWithReferencedObjects>,
                MissingPermissionsError
            > = await service.getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung(organisation.id, permissions);

            expectErrResult(result);
            expect(organisationRepo.findParentOrgasForIds).not.toHaveBeenCalled();
            expect(serviceProviderRepo.findByOrgasWithMerkmal).not.toHaveBeenCalled();
        });

        it('returns authorized serviceProviders when person has rights and includes parent organisation ids', async () => {
            const parentOrga: Organisation<true> = DoFactory.createOrganisation(true);
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.hasSystemrechtAtOrganisation = vi.fn().mockResolvedValue(true);

            organisationRepo.findParentOrgasForIds.mockResolvedValue([parentOrga]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            serviceProviderRepo.findByOrgasWithMerkmal.mockResolvedValue([[serviceProvider], 1]);
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Result<
                Counted<ManageableServiceProviderWithReferencedObjects>,
                MissingPermissionsError
            > = await service.getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung(organisation.id, permissions);

            expect(serviceProviderRepo.findByOrgasWithMerkmal).toHaveBeenCalledWith(
                [organisation.id, parentOrga.id],
                ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                undefined,
                undefined,
            );
            expectOkResult(result);
            expect(
                result.value[0].map((s: ManageableServiceProviderWithReferencedObjects) => s.serviceProvider),
            ).toContain(serviceProvider);
            expect(result.value[1]).toBe(1);
        });

        it('returns authorized serviceProviders when person has rights and includes parent organisation ids (limit & offset)', async () => {
            const parentOrga: Organisation<true> = DoFactory.createOrganisation(true);
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.hasSystemrechtAtOrganisation = vi.fn().mockResolvedValue(true);

            const limit: number = 10;
            const offset: number = 5;

            organisationRepo.findParentOrgasForIds.mockResolvedValue([parentOrga]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            serviceProviderRepo.findByOrgasWithMerkmal.mockResolvedValue([[serviceProvider], 1]);
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Result<
                Counted<ManageableServiceProviderWithReferencedObjects>,
                MissingPermissionsError
            > = await service.getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung(
                organisation.id,
                permissions,
                limit,
                offset,
            );

            expect(serviceProviderRepo.findByOrgasWithMerkmal).toHaveBeenCalledWith(
                [organisation.id, parentOrga.id],
                ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                limit,
                offset,
            );
            expectOkResult(result);
            expect(
                result.value[0].map((s: ManageableServiceProviderWithReferencedObjects) => s.serviceProvider),
            ).toContain(serviceProvider);
            expect(result.value[1]).toBe(1);
        });
    });

    describe('findManageableById', () => {
        let organisation: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;
        let rollenerweiterung: Rollenerweiterung<true>;
        let permissions: DeepMocked<PersonPermissions>;

        beforeEach(() => {
            organisation = DoFactory.createOrganisation(true);
            rolle = DoFactory.createRolle(true);
            serviceProvider = DoFactory.createServiceProvider(true, {
                providedOnSchulstrukturknoten: organisation.id,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });
            rollenerweiterung = DoFactory.createRollenerweiterung(true);
            permissions = createMock(PersonPermissions);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('returns service provider when user has "all" permissions', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);

            expect(serviceProviderRepo.findById).toHaveBeenCalledWith(serviceProvider.id);
            expect(result?.serviceProvider).toEqual(serviceProvider);
        });

        it('returns service provider via authorized query when user has limited permissions', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [organisation.id],
            });

            const parent: Organisation<true> = DoFactory.createOrganisation(true);
            organisation.administriertVon = parent.id;
            serviceProvider.providedOnSchulstrukturknoten = parent.id;
            organisationRepo.findParentOrgasForIds.mockResolvedValue([parent]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);

            expect(organisationRepo.findParentOrgasForIds).toHaveBeenCalledWith([organisation.id]);
            expect(serviceProviderRepo.findById).toHaveBeenCalledWith(serviceProvider.id);
            expect(result?.serviceProvider).toEqual(serviceProvider);
        });

        it('returns None when user has "all" permissions but provider does not exist', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            serviceProviderRepo.findById.mockResolvedValue(null);

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, 'nonexistent-id');

            expect(result).toBe(undefined);
        });

        it('returns None when authorized fetch does not resolve to the correct administrationsebene', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [faker.string.uuid()],
            });
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);

            organisationRepo.findParentOrgasForIds.mockResolvedValue([]);

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);

            expect(result).toBe(undefined);
        });

        it('sets relevantSystemrechte correctly for ANGEBOTE_VERWALTEN and ANGEBOTE_EINGESCHRAENKT_VERWALTEN', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissions.hasSystemrechtAtOrganisation.mockImplementation(
                (_: OrganisationID, recht: RollenSystemRecht): Promise<boolean> => {
                    if (recht === RollenSystemRecht.ANGEBOTE_VERWALTEN) {
                        return Promise.resolve(true);
                    }
                    if (recht === RollenSystemRecht.ANGEBOTE_EINGESCHRAENKT_VERWALTEN) {
                        return Promise.resolve(true);
                    }
                    return Promise.resolve(false);
                },
            );
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);
            expect(result?.relevantSystemrechte).toContain(RollenSystemRecht.ANGEBOTE_VERWALTEN);
            expect(result?.relevantSystemrechte).toContain(RollenSystemRecht.ANGEBOTE_EINGESCHRAENKT_VERWALTEN);
        });

        it('sets relevantSystemrechte correctly for ROLLEN_ERWEITERN (all = true)', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(false);
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);
            expect(result?.relevantSystemrechte).toContain(RollenSystemRecht.ROLLEN_ERWEITERN);
        });

        it('sets relevantSystemrechte correctly for ROLLEN_ERWEITERN (orgaIds contains provider)', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisation.id] });
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(false);
            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);
            expect(result?.relevantSystemrechte).toContain(RollenSystemRecht.ROLLEN_ERWEITERN);
        });

        it('sets relevantSystemrechte correctly for ROLLEN_ERWEITERN (parent orga case)', async () => {
            const parent: Organisation<true> = DoFactory.createOrganisation(true);
            organisation.administriertVon = parent.id;
            serviceProvider.providedOnSchulstrukturknoten = parent.id;

            serviceProviderRepo.findById.mockResolvedValue(serviceProvider);
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(false);
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisation.id] });
            organisationRepo.findParentOrgasForIds.mockResolvedValue([parent]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const result: Option<ManageableServiceProviderDetailsWithReferencedObjects> =
                await service.findManageableById(permissions, serviceProvider.id);
            expect(result?.relevantSystemrechte).toContain(RollenSystemRecht.ROLLEN_ERWEITERN);
        });
    });

    describe('findAuthorized', () => {
        let organisation: Organisation<true>;
        let rolle: Rolle<true>;
        let rolle2: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;
        let rollenerweiterung: Rollenerweiterung<true>;
        let rollenerweiterung1: Rollenerweiterung<true>;
        let permissions: DeepMocked<PersonPermissions>;

        beforeEach(() => {
            organisation = DoFactory.createOrganisation(true);
            rolle = DoFactory.createRolle(true);
            rolle2 = DoFactory.createRolle(true);
            serviceProvider = DoFactory.createServiceProvider(true, {
                providedOnSchulstrukturknoten: organisation.id,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });
            rollenerweiterung = DoFactory.createRollenerweiterung(true, { serviceProviderId: serviceProvider.id });
            rollenerweiterung1 = DoFactory.createRollenerweiterung(true, { serviceProviderId: serviceProvider.id });
            permissions = createMock(PersonPermissions);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('returns all service providers when user has "all" permissions with sorted Rollenerweiterungen', async () => {
            const serviceProvider2: ServiceProvider<true> = DoFactory.createServiceProvider(true);

            const nameA: string = faker.string.alpha(8);
            const nameB: string = faker.string.alpha(8);

            const [unsorted1, unsorted2]: [string, string] =
                nameA.localeCompare(nameB) > 0 ? [nameA, nameB] : [nameB, nameA];

            rolle.name = unsorted1;
            rolle2.name = unsorted2;

            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            serviceProviderRepo.findByOrganisationsWithMerkmale.mockResolvedValue([
                [serviceProvider, serviceProvider2],
                2,
            ]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(
                new Map([
                    [rollenerweiterung.rolleId, rolle],
                    [rollenerweiterung1.rolleId, rolle2],
                ]),
            );
            rolleRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([
                    [serviceProvider.id, [rolle]],
                    [serviceProvider2.id, []],
                ]),
            );
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([
                    [serviceProvider.id, [rollenerweiterung, rollenerweiterung1]],
                    [serviceProvider2.id, []],
                ]),
            );

            const [result, count]: Counted<ManageableServiceProviderWithReferencedObjects> =
                await service.findAuthorized(permissions, 10, 0);

            const names: string[] =
                result[0]?.rollenerweiterungenWithName?.map(
                    (r: RollenerweiterungForManageableServiceProvider) => r.rolle.name,
                ) ?? [];

            expect(permissions.getOrgIdsWithSystemrecht).toHaveBeenCalledWith(
                [RollenSystemRecht.ANGEBOTE_VERWALTEN],
                true,
            );
            expect(serviceProviderRepo.findByOrganisationsWithMerkmale).toHaveBeenCalledWith('all', 10, 0);
            expect(result).toHaveLength(2);
            expect(count).toBe(2);
            expect(rolleRepo.findByServiceProviderIds).toHaveBeenCalledWith(
                [serviceProvider.id, serviceProvider2.id],
                20,
            );
            expect(names).toEqual([...names].sort((a: string, b: string) => a.localeCompare(b)));
        });

        it('returns filtered service providers when user has limited permissions', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [organisation.id],
            });

            serviceProviderRepo.findByOrganisationsWithMerkmale.mockResolvedValue([[serviceProvider], 1]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const [result, count]: Counted<ManageableServiceProviderWithReferencedObjects> =
                await service.findAuthorized(permissions, 10, 0);

            expect(serviceProviderRepo.findByOrganisationsWithMerkmale).toHaveBeenCalledWith([organisation.id], 10, 0);
            expect(result).toHaveLength(1);
            expect(result[0]?.serviceProvider).toEqual(serviceProvider);
            expect(count).toBe(1);
        });

        it('respects limit and offset parameters', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            serviceProviderRepo.findByOrganisationsWithMerkmale.mockResolvedValue([[serviceProvider], 100]);
            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );
            rolleRepo.findByIds.mockResolvedValue(new Map([[rolle.id, rolle]]));
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProvider.id, [rolle]]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProvider.id, [rollenerweiterung]]]),
            );

            const limit: number = 5;
            const offset: number = 10;

            await service.findAuthorized(permissions, limit, offset);

            expect(serviceProviderRepo.findByOrganisationsWithMerkmale).toHaveBeenCalledWith('all', limit, offset);
        });

        it('returns empty array when no service providers found', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            serviceProviderRepo.findByOrganisationsWithMerkmale.mockResolvedValue([[], 0]);

            const [result, count]: Counted<ManageableServiceProviderWithReferencedObjects> =
                await service.findAuthorized(permissions);

            expect(result).toHaveLength(0);
            expect(count).toBe(0);
        });

        it('falls back to empty arrays when no rollen or rollenerweiterungen exist', async () => {
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });

            serviceProviderRepo.findByOrganisationsWithMerkmale.mockResolvedValue([[serviceProvider], 1]);

            organisationRepo.findByIds.mockResolvedValue(
                new Map([[serviceProvider.providedOnSchulstrukturknoten, organisation]]),
            );

            // return EMPTY maps (no entry for serviceProvider.id)
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map());
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(new Map());

            // also needed for enrichment step
            rolleRepo.findByIds.mockResolvedValue(new Map());
            organisationRepo.findByIds.mockResolvedValue(new Map());

            const [result]: Counted<ManageableServiceProviderWithReferencedObjects> = await service.findAuthorized(
                permissions,
                10,
                0,
            );

            expect(result[0]?.rollen).toEqual([]);
            expect(result[0]?.rollenerweiterungen).toEqual([]);
            expect(result[0]?.rollenerweiterungenWithName).toEqual([]);
        });
    });

    describe('updateServiceProvider', () => {
        let permissions: DeepMocked<PersonPermissions>;
        let existingServiceProvider: ServiceProvider<true>;

        beforeEach(() => {
            permissions = createMock(PersonPermissions);
            existingServiceProvider = DoFactory.createServiceProvider(true, {
                logo: undefined,
                logoMimeType: undefined,
                logoId: faker.number.int({ min: 1, max: 1000 }),
            });
            serviceProviderRepo.findById.mockResolvedValue(existingServiceProvider);
            serviceProviderRepo.update.mockResolvedValue(Ok(existingServiceProvider));
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should update service provider', async () => {
            const newAngebotId: string = faker.string.uuid();
            const updateData: UpdateServiceProviderBodyParams = {
                name: 'New Name',
                url: 'https://new-url.com',
                kategorie: ServiceProviderKategorie.EMAIL,
                logoId: faker.number.int({ min: 1, max: 1000 }),
            };

            const result: Result<ServiceProvider<true>, Error> = await service.updateServiceProvider(
                permissions,
                newAngebotId,
                updateData,
            );

            expect(serviceProviderRepo.findById).toHaveBeenCalledWith(newAngebotId, { withLogo: true });
            expect(serviceProviderRepo.update).toHaveBeenCalledWith(
                permissions,
                expect.objectContaining({
                    name: updateData.name,
                    url: updateData.url,
                    kategorie: updateData.kategorie,
                    logoId: updateData.logoId,
                }),
            );
            expectOkResult(result);
            expect(result.value).toEqual(existingServiceProvider);
        });

        it.each([
            ['name', { name: 'New Name' }],
            ['url', { url: 'https://new-url.com' }],
            ['kategorie', { kategorie: ServiceProviderKategorie.EMAIL }],
            ['logoId', { logoId: faker.number.int({ min: 1, max: 1000 }) }],
        ] as [keyof UpdateServiceProviderBodyParams, UpdateServiceProviderBodyParams][])(
            'should update service provider %s only',
            async (_: keyof UpdateServiceProviderBodyParams, updateData: UpdateServiceProviderBodyParams) => {
                const newAngebotId: string = faker.string.uuid();

                const result: Result<ServiceProvider<true>, Error> = await service.updateServiceProvider(
                    permissions,
                    newAngebotId,
                    updateData,
                );

                expectOkResult(result);

                expect(serviceProviderRepo.findById).toHaveBeenCalledWith(newAngebotId, { withLogo: true });
                expect(serviceProviderRepo.update).toHaveBeenCalledWith(
                    permissions,
                    expect.objectContaining({
                        ...existingServiceProvider,
                        ...updateData,
                    }),
                );
                expect(result.value).toEqual(existingServiceProvider);
            },
        );

        it('should return error if service provider does not exist', async () => {
            serviceProviderRepo.findById.mockResolvedValue(null);

            const updateData: UpdateServiceProviderBodyParams = { name: 'New Name' };
            const updateResult: Result<ServiceProvider<true>, DomainError> = await service.updateServiceProvider(
                permissions,
                'nonexistent-id',
                updateData,
            );

            expectErrResult(updateResult);
            expect(updateResult.error).toBeInstanceOf(EntityNotFoundError);

            expect(serviceProviderRepo.update).not.toHaveBeenCalled();
        });

        it('should return error if logo and logoId are both provided', async () => {
            const existingServiceProviderWithLogo: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            serviceProviderRepo.findById.mockResolvedValue(existingServiceProviderWithLogo);

            const updateData: UpdateServiceProviderBodyParams = { logoId: faker.number.int({ min: 1, max: 1000 }) };
            const updateResult: Result<ServiceProvider<true>, DomainError> = await service.updateServiceProvider(
                permissions,
                existingServiceProviderWithLogo.id,
                updateData,
            );

            expectErrResult(updateResult);
            expect(updateResult.error).toBeInstanceOf(InvalidLogoCombinationError);

            expect(serviceProviderRepo.update).not.toHaveBeenCalled();
        });

        it('should reject updates for VIDIS-linked service providers', async () => {
            const vidisLinkedServiceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                vidisAngebotId: faker.string.uuid(),
            });
            serviceProviderRepo.findById.mockResolvedValue(vidisLinkedServiceProvider);

            const result: Result<ServiceProvider<true>, DomainError> = await service.updateServiceProvider(
                permissions,
                vidisLinkedServiceProvider.id,
                { name: 'New Name' },
            );

            expectErrResult(result);
            expect(result.error).toBeInstanceOf(VidisServiceProviderImmutableError);
            expect(serviceProviderRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteByIdAuthorized', () => {
        let permissions: ReturnType<typeof createPersonPermissionsMock>;
        const mockServiceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
        const serviceProviderId: ServiceProviderID = mockServiceProvider.id;

        beforeEach(() => {
            permissions = createPersonPermissionsMock();
            vi.resetAllMocks();
            serviceProviderRepo.findById.mockResolvedValue(mockServiceProvider);
        });

        it('returns AttachedRollenError if attached Rollen exist', async () => {
            rolleRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProviderId, [DoFactory.createRolle(true)]]]),
            );
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));
            const result: Result<void, AttachedRollenError> = await service.deleteByIdAuthorized(
                permissions,
                serviceProviderId,
            );
            expectErrResult(result);
            expect(result.error).toBeInstanceOf(AttachedRollenError);
        });

        it('returns AttachedRollenerweiterungenError if attached Rollenerweiterungen exist', async () => {
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(
                new Map([[serviceProviderId, [DoFactory.createRollenerweiterung(true)]]]),
            );
            const result: Result<void, AttachedRollenerweiterungenError> = await service.deleteByIdAuthorized(
                permissions,
                serviceProviderId,
            );
            expectErrResult(result);
            expect(result.error).toBeInstanceOf(AttachedRollenerweiterungenError);
        });

        it('returns error for VIDIS-linked service providers before deleting', async () => {
            const vidisLinkedServiceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true, {
                vidisAngebotId: faker.string.uuid(),
            });
            serviceProviderRepo.findById.mockResolvedValue(vidisLinkedServiceProvider);
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));

            const result: Result<void, ServiceProviderError> = await service.deleteByIdAuthorized(
                permissions,
                vidisLinkedServiceProvider.id,
            );

            expectErrResult(result);
            expect(result.error).toBeInstanceOf(VidisServiceProviderImmutableError);
            expect(serviceProviderRepo.deleteByIdAuthorized).not.toHaveBeenCalled();
        });

        it('calls deleteById and returns Ok() on success', async () => {
            const expectedResult: Result<void, ServiceProviderError> = Ok();
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(new Map([[serviceProviderId, []]]));
            serviceProviderRepo.deleteByIdAuthorized.mockResolvedValue(expectedResult);

            const result: Result<void, ServiceProviderError> = await service.deleteByIdAuthorized(
                permissions,
                serviceProviderId,
            );

            expect(serviceProviderRepo.deleteByIdAuthorized).toHaveBeenCalledWith(permissions, serviceProviderId);
            expect(result).toBe(expectedResult);
        });

        it('calls deleteById and returns Error on failure', async () => {
            const expectedResult: Result<void, ServiceProviderError> = Err(new EntityNotFoundError());
            rolleRepo.findByServiceProviderIds.mockResolvedValue(new Map([]));
            rollenerweiterungRepo.findByServiceProviderIds.mockResolvedValue(new Map([]));
            serviceProviderRepo.deleteByIdAuthorized.mockResolvedValue(expectedResult);
            const result: Result<void, ServiceProviderError> = await service.deleteByIdAuthorized(
                permissions,
                serviceProviderId,
            );
            expect(serviceProviderRepo.deleteByIdAuthorized).toHaveBeenCalledWith(permissions, serviceProviderId);
            expect(result).toBe(expectedResult);
        });
    });
});
