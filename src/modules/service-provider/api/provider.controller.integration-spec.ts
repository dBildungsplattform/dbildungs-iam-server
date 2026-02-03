import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RawPagedResponse } from '../../../shared/paging/raw-paged.response.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { OIDC_CLIENT } from '../../authentication/services/oidc-client.service.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderApiModule } from '../service-provider-api.module.js';
import { ManageableServiceProviderListEntryResponse } from './manageable-service-provider-list-entry.response.js';
import { ManageableServiceProviderResponse } from './manageable-service-provider.response.js';
import { ManageableServiceProvidersParams } from './manageable-service-providers.params.js';
import {
    createAuthInterceptorMock,
    createOidcClientMock,
    createPersonPermissionsMock,
} from '../../../../test/utils/auth.mock.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderMerkmal } from '../domain/service-provider.enum.js';

describe('ServiceProvider API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let serviceProviderRepo: ServiceProviderRepo;
    let rolleRepo: RolleRepo;
    let rollenerweiterungRepo: RollenerweiterungRepo;
    let organisationRepo: OrganisationRepository;
    const personPermissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ServiceProviderApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: OIDC_CLIENT,
                    useValue: createOidcClientMock(),
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock(PersonPermissionsRepo),
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: createAuthInterceptorMock(personPermissions),
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        rolleRepo = module.get(RolleRepo);
        rollenerweiterungRepo = module.get(RollenerweiterungRepo);
        organisationRepo = module.get(OrganisationRepository);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        personPermissions.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
    });

    describe('/GET all service provider', () => {
        it('should return all service provider', async () => {
            await Promise.all([
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
            ]);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/provider/all')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(3);
        });
    });

    describe('/GET logo', () => {
        describe('when the service provider exists and has a logo', () => {
            it('should return the image file', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Buffer);
            });
        });

        describe('when the service provider exists but does not have a logo', () => {
            it('should return 404', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false, { logo: undefined, logoMimeType: undefined }),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(404);
            });
        });

        describe('when the service provider does not exist', () => {
            it('should return 404', async () => {
                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/provider/${serviceProvider.id}/logo`)
                    .send();

                expect(response.status).toBe(404);
            });
        });
    });

    describe('/GET manageable service providers', () => {
        it('should return manageable service providers with linked objects', async () => {
            // Arrange: create organisation, rolle, and service providers
            const organisation: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            const serviceProvider1: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: organisation.id }),
            );
            const serviceProvider2: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: organisation.id }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    serviceProviderIds: [serviceProvider1.id],
                }),
            );
            if (rolle instanceof DomainError) {
                throw rolle;
            }

            const params: ManageableServiceProvidersParams = { limit: 10, offset: 0 };
            const response: Response = await request(app.getHttpServer() as App)
                .get('/provider/manageable')
                .query(params)
                .send();

            const body: RawPagedResponse<ManageableServiceProviderListEntryResponse> =
                response.body as RawPagedResponse<ManageableServiceProviderListEntryResponse>;
            expect(response.status).toBe(200);
            expect(body.items).toBeInstanceOf(Array);
            expect(body.items.length).toBeGreaterThanOrEqual(2);
            expect(body.limit).toBe(params.limit);
            expect(body.offset).toBe(params.offset);
            expect(body.total).toBe(2);

            [serviceProvider1, serviceProvider2].forEach((sp: ServiceProvider<true>) => {
                const entry: ManageableServiceProviderListEntryResponse | undefined = body.items.find(
                    (e: ManageableServiceProviderListEntryResponse) => e.id === sp.id,
                );

                expect(entry).toBeDefined();
                expect(entry?.id).toBe(sp.id);
                expect(entry?.name).toBe(sp.name);
                expect(entry?.administrationsebene.id).toBe(organisation.id);
                expect(entry?.administrationsebene.name).toBe(organisation.name);
                expect(entry?.administrationsebene.kennung).toBe(organisation.kennung);
                expect(entry?.kategorie).toBe(sp.kategorie);
                expect(entry?.requires2fa).toBe(sp.requires2fa);
                expect(entry?.merkmale).toEqual(expect.arrayContaining(serviceProvider1.merkmale));
                expect(entry?.hasRollenerweiterung).toBe(false);
                expect(entry?.rollen).toBeInstanceOf(Array);
                if (rolle.serviceProviderIds.includes(sp.id)) {
                    expect(entry?.rollen.length).toBe(1);
                    expect(entry?.rollen[0]!.id).toBe(rolle.id);
                    expect(entry?.rollen[0]!.name).toBe(rolle.name);
                } else {
                    expect(entry?.rollen.length).toBe(0);
                }
            });
        });
    });

    describe('/GET manageable service provider for organisation', () => {
        let organisation: Organisation<true>;
        let serviceProvider: ServiceProvider<true>;
        let rolle: Rolle<true>;
        let rolleWithErweiterung: Rolle<true>;

        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    providedOnSchulstrukturknoten: organisation.id,
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            const rolleError: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    serviceProviderIds: [serviceProvider.id],
                }),
            );
            if (rolleError instanceof DomainError) {
                throw rolleError;
            }
            rolle = rolleError;
            const rolleWithErweiterungError: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                }),
            );
            if (rolleWithErweiterungError instanceof DomainError) {
                throw rolleWithErweiterungError;
            }
            rolleWithErweiterung = rolleWithErweiterungError;
            await rollenerweiterungRepo.create(
                DoFactory.createRollenerweiterung(false, {
                    organisationId: organisation.id,
                    rolleId: rolleWithErweiterung.id,
                    serviceProviderId: serviceProvider.id,
                }),
            );
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return manageable service provider for organisation', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get('/provider/manageable-by-organisation')
                .query({ organisationId: organisation.id })
                .send();

            const body: RawPagedResponse<ManageableServiceProviderListEntryResponse> =
                response.body as RawPagedResponse<ManageableServiceProviderListEntryResponse>;
            expect(response.status).toBe(200);

            expect(body).toEqual<RawPagedResponse<ManageableServiceProviderListEntryResponse>>({
                items: [
                    {
                        id: serviceProvider.id,
                        name: serviceProvider.name,
                        administrationsebene: {
                            id: organisation.id,
                            name: organisation.name!,
                            kennung: organisation.kennung!,
                        },
                        kategorie: serviceProvider.kategorie,
                        requires2fa: serviceProvider.requires2fa,
                        merkmale: serviceProvider.merkmale,
                        hasRollenerweiterung: true,
                        rollen: [
                            {
                                id: rolle.id,
                                name: rolle.name,
                            },
                        ],
                    },
                ],
                limit: 1,
                offset: 0,
                total: 1,
            } as RawPagedResponse<ManageableServiceProviderListEntryResponse>);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get('/provider/manageable-by-organisation')
                .query({ organisationId: faker.string.uuid() })
                .send();

            const body: RawPagedResponse<ManageableServiceProviderListEntryResponse> =
                response.body as RawPagedResponse<ManageableServiceProviderListEntryResponse>;
            expect(response.status).toBe(200);

            expect(body).toEqual<RawPagedResponse<ManageableServiceProviderListEntryResponse>>({
                items: [],
                limit: 0,
                offset: 0,
                total: 0,
            } as RawPagedResponse<ManageableServiceProviderListEntryResponse>);
        });
    });

    describe('/GET manageable service provider by id', () => {
        let organisation: Organisation<true>;
        let serviceProvider: ServiceProvider<true>;
        let rolle: Rolle<true>;
        let rolleWithErweiterung: Rolle<true>;

        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: organisation.id }),
            );
            rolle = (await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    serviceProviderIds: [serviceProvider.id],
                }),
            )) as Rolle<true>;
            if (rolle instanceof DomainError) {
                throw rolle;
            }
            rolleWithErweiterung = (await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                }),
            )) as Rolle<true>;
            if (rolleWithErweiterung instanceof DomainError) {
                throw rolleWithErweiterung;
            }
            await rollenerweiterungRepo.create(
                DoFactory.createRollenerweiterung(false, {
                    organisationId: organisation.id,
                    rolleId: rolleWithErweiterung.id,
                    serviceProviderId: serviceProvider.id,
                }),
            );
        });

        it('should return manageable service provider', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/provider/manageable/${serviceProvider.id}`)
                .send();

            const body: ManageableServiceProviderResponse = response.body as ManageableServiceProviderResponse;
            expect(response.status).toBe(200);

            expect(body).toEqual<ManageableServiceProviderResponse>({
                id: serviceProvider.id,
                name: serviceProvider.name,
                administrationsebene: {
                    id: organisation.id,
                    name: organisation.name!,
                    kennung: organisation.kennung!,
                },
                kategorie: serviceProvider.kategorie,
                requires2fa: serviceProvider.requires2fa,
                merkmale: serviceProvider.merkmale,
                url: serviceProvider.url,
                hasRollenerweiterung: true,
                availableForRollenerweiterung: false,
                rollen: [
                    {
                        id: rolle.id,
                        name: rolle.name,
                    },
                ],
            } as ManageableServiceProviderResponse);
        });

        it('should return 404 if service provider is not found', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/provider/manageable/${faker.string.uuid()}`)
                .send();

            expect(response.status).toBe(404);
        });
    });
});
