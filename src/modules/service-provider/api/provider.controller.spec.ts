import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { HttpException, INestApplication, UnauthorizedException } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'openid-client';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderService } from '../domain/service-provider.service.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderApiModule } from '../service-provider-api.module.js';
import { ProviderController } from './provider.controller.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { ManageableServiceProvidersParams } from './manageable-service-providers.params.js';
import { ManageableServiceProviderWithReferencedObjects } from '../domain/types.js';
import { RawPagedResponse } from '../../../shared/paging/raw-paged.response.js';
import { ManageableServiceProviderListEntryResponse } from './manageable-service-provider-list-entry.response.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { StreamableFileFactory } from '../../../shared/util/streamable-file.factory.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenerweiterungWithExtendedDataResponse } from '../../rolle/api/rollenerweiterung-with-extended-data.response.js';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { ServiceProviderFactory } from '../domain/service-provider.factory.js';
import { CreateServiceProviderBodyParams } from './create-service-provider-body.params.js';
import {
    ServiceProviderTarget,
    ServiceProviderKategorie,
    ServiceProviderSystem,
} from '../domain/service-provider.enum.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { ManageableServiceProvidersForOrganisationParams } from './manageable-service-providers-for-organisation.params.js';
import { RollenerweiterungByServiceProvidersIdQueryParams } from './rollenerweiterung-by-service-provider-id.queryparams.js';
import { RollenerweiterungByServiceProvidersIdPathParams } from './rollenerweiterung-by-service-provider-id.pathparams.js';

describe('Provider Controller Test', () => {
    let app: INestApplication;
    let serviceProviderServiceMock: DeepMocked<ServiceProviderService>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let serviceProviderFactoryMock: DeepMocked<ServiceProviderFactory>;
    let providerController: ProviderController;
    let personPermissionsMock: DeepMocked<PersonPermissions>;
    const oidcClientMock: DeepMocked<Client> = {
        grant: vi.fn(),
        userinfo: vi.fn(),
    } as DeepMocked<Client>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ServiceProviderApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: OIDC_CLIENT,
                    useValue: oidcClientMock,
                },
            ],
        })
            .overrideProvider(ServiceProviderService)
            .useValue(createMock(ServiceProviderService))
            .overrideProvider(ServiceProviderRepo)
            .useValue(createMock<ServiceProviderRepo>(ServiceProviderRepo))
            .overrideProvider(ServiceProviderFactory)
            .useValue(createMock<ServiceProviderFactory>(ServiceProviderFactory))
            .compile();

        serviceProviderServiceMock = module.get<DeepMocked<ServiceProviderService>>(ServiceProviderService);
        serviceProviderRepoMock = module.get<DeepMocked<ServiceProviderRepo>>(ServiceProviderRepo);
        serviceProviderFactoryMock = module.get<DeepMocked<ServiceProviderFactory>>(ServiceProviderFactory);
        providerController = module.get(ProviderController);
        personPermissionsMock = createPersonPermissionsMock();

        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await app.close();
    });

    describe('findRollenerweiterungenByServiceProviderId', () => {
        let permissionsMock: DeepMocked<PersonPermissions>;
        let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
        let rolleRepoMock: DeepMocked<RolleRepo>;
        let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
        let providerController: ProviderController;

        beforeEach(() => {
            permissionsMock = createPersonPermissionsMock();
            rollenerweiterungRepoMock = createMock(RollenerweiterungRepo);
            rolleRepoMock = createMock(RolleRepo);
            organisationRepositoryMock = createMock(OrganisationRepository);
            providerController = new ProviderController(
                createMock(StreamableFileFactory),
                createMock(ServiceProviderFactory),
                createMock(ServiceProviderRepo),
                createMock(ServiceProviderService),
                rollenerweiterungRepoMock,
                rolleRepoMock,
                organisationRepositoryMock,
            );
        });

        it('should throw UnauthorizedException if user has no permitted orgas', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [] });

            await expect(
                providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    { offset: 0, limit: faker.number.int({ min: 1, max: 100 }) },
                ),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('should return paged response with items and correct total if user is only permitted on some orgas', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: ['FixedOrgaId'] });

            const rollenerweiterung: Rollenerweiterung<true> = DoFactory.createRollenerweiterung(true);
            rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung.mockResolvedValueOnce([
                [rollenerweiterung],
                1,
            ]);

            const offset: number = faker.number.int({ min: 1, max: 100 });
            const limit: number = faker.number.int({ min: 1, max: 100 });

            organisationRepositoryMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.organisationId,
                        DoFactory.createOrganisation(true, {
                            id: rollenerweiterung.organisationId,
                            name: 'FixedOrgaName',
                            kennung: 'FixedOrgaKennung',
                        }),
                    ],
                ]),
            );
            rolleRepoMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.rolleId,
                        DoFactory.createRolle(true, { id: rollenerweiterung.rolleId, name: 'FixedRolleName' }),
                    ],
                ]),
            );

            const result: RawPagedResponse<RollenerweiterungWithExtendedDataResponse> =
                await providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    { offset: offset, limit: limit },
                );

            expect(rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung).toHaveBeenCalledWith(
                expect.any(String),
                ['FixedOrgaId'],
                offset,
                limit,
            );

            expect(result).toBeInstanceOf(RawPagedResponse);
            expect(result.offset).toBe(offset);
            expect(result.limit).toBe(limit);
            expect(result.total).toBe(1);
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toBeInstanceOf(RollenerweiterungWithExtendedDataResponse);
            expect(result.items[0]?.rolleName).toBe('FixedRolleName');
            expect(result.items[0]?.organisationName).toBe('FixedOrgaName');
            expect(result.items[0]?.organisationKennung).toBe('FixedOrgaKennung');
        });

        it('should throw MissingPermissionsError when user lacks permission when filtering for orga', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                all: false,
                orgaIds: ['org-2'],
            });
            const pathparams: RollenerweiterungByServiceProvidersIdPathParams = { angebotId: faker.string.uuid() };
            const queryparams: RollenerweiterungByServiceProvidersIdQueryParams = {
                organisationId: 'org-1',
                limit: 10,
                offset: 0,
            };

            await expect(
                providerController.findRollenerweiterungenByServiceProviderId(permissions, pathparams, queryparams),
            ).rejects.toThrow(HttpException);
        });

        it('should return paged response with items and correct total', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });

            const rollenerweiterung: Rollenerweiterung<true> = DoFactory.createRollenerweiterung(true);
            rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung.mockResolvedValueOnce([
                [rollenerweiterung],
                1,
            ]);

            const offset: number = faker.number.int({ min: 1, max: 100 });
            const limit: number = faker.number.int({ min: 1, max: 100 });

            organisationRepositoryMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.organisationId,
                        DoFactory.createOrganisation(true, {
                            id: rollenerweiterung.organisationId,
                            name: 'FixedOrgaName',
                            kennung: 'FixedOrgaKennung',
                        }),
                    ],
                ]),
            );
            rolleRepoMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.rolleId,
                        DoFactory.createRolle(true, { id: rollenerweiterung.rolleId, name: 'FixedRolleName' }),
                    ],
                ]),
            );

            const result: RawPagedResponse<RollenerweiterungWithExtendedDataResponse> =
                await providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    { offset: offset, limit: limit },
                );

            expect(rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung).toHaveBeenCalledWith(
                expect.any(String),
                undefined,
                offset,
                limit,
            );

            expect(result).toBeInstanceOf(RawPagedResponse);
            expect(result.offset).toBe(offset);
            expect(result.limit).toBe(limit);
            expect(result.total).toBe(1);
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toBeInstanceOf(RollenerweiterungWithExtendedDataResponse);
            expect(result.items[0]?.rolleName).toBe('FixedRolleName');
            expect(result.items[0]?.organisationName).toBe('FixedOrgaName');
            expect(result.items[0]?.organisationKennung).toBe('FixedOrgaKennung');
        });

        it('should return fallbacks as empty strings for extended data of related aggregate is mising', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });

            const rollenerweiterung: Rollenerweiterung<true> = DoFactory.createRollenerweiterung(true);
            rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung.mockResolvedValueOnce([
                [rollenerweiterung],
                1,
            ]);

            organisationRepositoryMock.findByIds.mockResolvedValue(new Map());
            rolleRepoMock.findByIds.mockResolvedValue(new Map());

            const offset: number = faker.number.int({ min: 1, max: 100 });
            const limit: number = faker.number.int({ min: 1, max: 100 });

            const result: RawPagedResponse<RollenerweiterungWithExtendedDataResponse> =
                await providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    { offset: offset, limit: limit },
                );

            expect(result).toBeInstanceOf(RawPagedResponse);
            expect(result.offset).toBe(offset);
            expect(result.limit).toBe(limit);
            expect(result.total).toBe(1);
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toBeInstanceOf(RollenerweiterungWithExtendedDataResponse);
            expect(result.items[0]?.rolleName).toBe('');
            expect(result.items[0]?.organisationName).toBe('');
            expect(result.items[0]?.organisationKennung).toBe('');
        });

        it('should return paged response with default offset and limit if not provided', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });

            const rollenerweiterung: Rollenerweiterung<true> = DoFactory.createRollenerweiterung(true);
            rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung.mockResolvedValueOnce([
                [rollenerweiterung],
                1,
            ]);

            rolleRepoMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.rolleId,
                        DoFactory.createRolle(true, { id: rollenerweiterung.rolleId, name: faker.person.firstName() }),
                    ],
                ]),
            );

            organisationRepositoryMock.findByIds.mockResolvedValue(
                new Map([
                    [
                        rollenerweiterung.organisationId,
                        DoFactory.createOrganisation(true, {
                            id: rollenerweiterung.organisationId,
                            name: faker.company.name(),
                            kennung: faker.string.alphanumeric(10),
                        }),
                    ],
                ]),
            );

            const result: RawPagedResponse<RollenerweiterungWithExtendedDataResponse> =
                await providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    {},
                );

            expect(result.offset).toBe(0);
            expect(result.limit).toBe(1);
            expect(result.total).toBe(1);
            expect(result.items).toHaveLength(1);
        });

        it('should return empty items if repo returns empty array', async () => {
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
            rollenerweiterungRepoMock.findByServiceProviderIdPagedAndSortedByOrgaKennung.mockResolvedValueOnce([[], 0]);

            const result: RawPagedResponse<RollenerweiterungWithExtendedDataResponse> =
                await providerController.findRollenerweiterungenByServiceProviderId(
                    permissionsMock,
                    { angebotId: faker.string.uuid() },
                    { offset: 0, limit: 10 },
                );

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });

    describe('getAllServiceProviders', () => {
        describe('when service providers were found', () => {
            it('should return all service provider', async () => {
                const spId: string = faker.string.uuid();
                const sp: ServiceProvider<true> = DoFactory.createServiceProvider(true, { id: spId });

                serviceProviderRepoMock.find.mockResolvedValueOnce([sp]);

                const spResponse: ServiceProviderResponse[] = await providerController.getAllServiceProviders();
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(1);
            });
        });

        describe('when no service providers were found', () => {
            it('should return empty list as response', async () => {
                serviceProviderRepoMock.find.mockResolvedValueOnce([]);

                const spResponse: ServiceProviderResponse[] = await providerController.getAllServiceProviders();
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                expect(spResponse).toHaveLength(0);
            });
        });
    });

    describe('getAvailableServiceProviders', () => {
        let pk: Personenkontext<true>;
        let rolleId: string;
        let spId: string;
        let sp: ServiceProvider<true>;
        let personPermissions: DeepMocked<PersonPermissions>;

        beforeEach(() => {
            rolleId = faker.string.uuid();
            spId = faker.string.uuid();
            sp = DoFactory.createServiceProvider(true, { id: spId });
            pk = DoFactory.createPersonenkontext(true, { rolleId });
            personPermissions = createMock(PersonPermissions);
            personPermissions.getPersonenkontextIds.mockResolvedValueOnce([
                { organisationId: pk.organisationId, rolleId: pk.rolleId },
            ]);
        });

        describe.each([
            ['found', true],
            ['not found', false],
        ])('when service providers were %s', (_label: string, hasFoundServiceProviders: boolean) => {
            beforeEach(() => {
                serviceProviderServiceMock.getServiceProvidersByOrganisationenAndRollen.mockResolvedValueOnce(
                    hasFoundServiceProviders ? [sp] : [],
                );
            });
            it('should return list of responses', async () => {
                const spResponse: ServiceProviderResponse[] =
                    await providerController.getAvailableServiceProviders(personPermissions);
                expect(spResponse).toBeDefined();
                expect(spResponse).toBeInstanceOf(Array);
                if (hasFoundServiceProviders) {
                    expect(spResponse).toHaveLength(1);
                } else {
                    expect(spResponse).toHaveLength(0);
                }
                expect(serviceProviderServiceMock.getServiceProvidersByOrganisationenAndRollen).toHaveBeenCalledWith([
                    { organisationId: pk.organisationId, rolleId: pk.rolleId },
                ]);
            });
        });
    });

    describe('getManageableServiceProviders', () => {
        it.each([
            { limit: 2, offset: 1 },
            { limit: undefined, offset: undefined },
        ])(
            'should return paged manageable service providers with correct offset and limit for %s',
            async (params: ManageableServiceProvidersParams) => {
                const total: number = 10;
                const serviceProviders: Array<ServiceProvider<true>> = [
                    DoFactory.createServiceProvider(true),
                    DoFactory.createServiceProvider(true),
                ];

                const manageableObjects: ManageableServiceProviderWithReferencedObjects[] = serviceProviders.map(
                    (serviceProvider: ServiceProvider<true>) => ({
                        serviceProvider: serviceProvider,
                        organisation: DoFactory.createOrganisation(true),
                        rollen: [DoFactory.createRolle(true)],
                        rollenerweiterungen: [DoFactory.createRollenerweiterung(true)],
                        enrichedRollenerweiterungen: [
                            {
                                serviceProviderId: serviceProvider.id,
                                organisation: DoFactory.createOrganisation(true),
                                rolle: DoFactory.createRolle(true),
                            },
                        ],
                    }),
                );

                serviceProviderServiceMock.findAuthorized.mockResolvedValue([manageableObjects, total]);

                const result: RawPagedResponse<ManageableServiceProviderListEntryResponse> =
                    await providerController.getManageableServiceProviders(personPermissionsMock, params);

                expect(result).toBeDefined();
                expect(result.offset).toBe(params.offset ?? 0);
                expect(result.limit).toBe(params.limit ?? total);
                expect(result.items).toHaveLength(2);
                expect(result.items[0]).toBeInstanceOf(ManageableServiceProviderListEntryResponse);
            },
        );
    });

    describe('getManageableServiceProvidersForOrganisationId', () => {
        it('should throw MissingPermissionsError when user lacks permission', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            const params: DeepMocked<ManageableServiceProvidersForOrganisationParams> = {
                organisationId: 'org-1',
                limit: 10,
                offset: 0,
            };

            serviceProviderServiceMock.getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung.mockResolvedValueOnce(
                {
                    ok: false,
                    error: new MissingPermissionsError('Rollen Erweitern Systemrecht Required For This Endpoint'),
                },
            );

            await expect(
                providerController.getManageableServiceProvidersForOrganisationId(permissions, params),
            ).rejects.toThrow(HttpException);
        });
    });

    describe('createServiceProvider', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });
        it('should create a new service provider when user has permission', async () => {
            const tinyPngBase64: string =
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBg0GwHjcAAAAASUVORK5CYII=';

            const body: CreateServiceProviderBodyParams = {
                name: faker.company.name(),
                target: ServiceProviderTarget.EMAIL,
                url: faker.internet.url(),
                kategorie: ServiceProviderKategorie.EMAIL,
                logoBase64: tinyPngBase64,
                requires2fa: false,
                vidisAngebotId: undefined,
                merkmale: [],
                organisationId: faker.string.uuid(),
            };

            const createdDomainSp: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedSp: ServiceProvider<true> = DoFactory.createServiceProvider(true);

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            serviceProviderFactoryMock.createNew.mockReturnValueOnce(createdDomainSp);
            serviceProviderRepoMock.save.mockResolvedValueOnce(persistedSp);

            const result: ServiceProviderResponse = await providerController.createServiceProvider(
                personPermissionsMock,
                body,
            );

            expect(result).toBeDefined();
            expect(serviceProviderFactoryMock.createNew).toHaveBeenCalledWith(
                body.name,
                body.target,
                body.url,
                body.kategorie,
                body.organisationId,
                Buffer.from(tinyPngBase64, 'base64'),
                undefined,
                undefined,
                undefined,
                ServiceProviderSystem.NONE,
                body.requires2fa,
                body.vidisAngebotId,
                body.merkmale,
            );
            expect(serviceProviderRepoMock.save).toHaveBeenCalledWith(createdDomainSp);
            expect(result).toBeInstanceOf(ServiceProviderResponse);
        });

        it('should create a new service provider without logo when user has permission', async () => {
            const body: CreateServiceProviderBodyParams = {
                name: faker.company.name(),
                target: ServiceProviderTarget.EMAIL,
                url: faker.internet.url(),
                kategorie: ServiceProviderKategorie.EMAIL,
                logoBase64: undefined,
                requires2fa: false,
                vidisAngebotId: undefined,
                merkmale: [],
                organisationId: faker.string.uuid(),
            };

            const createdDomainSp: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedSp: ServiceProvider<true> = DoFactory.createServiceProvider(true);

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            serviceProviderFactoryMock.createNew.mockReturnValueOnce(createdDomainSp);
            serviceProviderRepoMock.save.mockResolvedValueOnce(persistedSp);

            const result: ServiceProviderResponse = await providerController.createServiceProvider(
                personPermissionsMock,
                body,
            );

            expect(result).toBeDefined();
            expect(serviceProviderFactoryMock.createNew).toHaveBeenCalledWith(
                body.name,
                body.target,
                body.url,
                body.kategorie,
                body.organisationId,
                undefined,
                undefined,
                undefined,
                undefined,
                ServiceProviderSystem.NONE,
                body.requires2fa,
                body.vidisAngebotId,
                body.merkmale,
            );
            expect(serviceProviderRepoMock.save).toHaveBeenCalledWith(createdDomainSp);
            expect(result).toBeInstanceOf(ServiceProviderResponse);
        });

        it('should throw forbidden error when user lacks permission', async () => {
            const body: CreateServiceProviderBodyParams = {
                name: faker.company.name(),
                target: ServiceProviderTarget.EMAIL,
                url: undefined,
                kategorie: ServiceProviderKategorie.ANGEBOTE,
                requires2fa: false,
                vidisAngebotId: undefined,
                merkmale: [],
                organisationId: faker.string.uuid(),
            };

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            await expect(providerController.createServiceProvider(personPermissionsMock, body)).rejects.toBeDefined();
            expect(serviceProviderRepoMock.save).not.toHaveBeenCalled();
        });
    });
});
